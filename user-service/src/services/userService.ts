import { Op, type Transaction, Sequelize } from 'sequelize';
import User, { type UserAttributes, Gender } from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import type { CreateUserDto, UpdateUserDto, UserResponse, PaginatedResponse } from '../types';
import { withExistingTransaction, getTransaction } from '../config/transactionContext';
import { Transactional } from '../decorators/Transactional';
import { buildAttributes, buildInclude, buildSearchCondition } from '../utils/query-builders';

export interface UserFilterParams {
  search?: string;
  first_name?: string;
  last_name?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  gender?: Gender;
  include_deleted?: boolean;
  fields?: string; // Comma-separated: "id,firstName,lastName"
  include?: string; // Comma-separated: "roles,orders,orders.items"
}

export class UserService {
  @Transactional()
  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    // Validation đã đảm bảo first_name và last_name là required và không null
    // Với CLS enabled, transaction tự động được truyền vào tất cả queries
    // Transaction tự động được set vào CLS namespace bởi Sequelize (qua @Transactional decorator)
    
    const user = await User.create({
      cognitoUserId: userData.cognito_user_id ?? null,
      firstName: userData.first_name!, 
      lastName: userData.last_name!, 
      birthDate: userData.birth_date ? new Date(userData.birth_date) : null,
      gender: userData.gender ?? null,
      createdBy: userData.created_by ?? null,
    });

    // throw exception vào đây để test transaction
    // Set TEST_TRANSACTION=true trong .env để test transaction rollback
    if (process.env['TEST_TRANSACTION'] === 'true') {
      throw new Error('Test transaction rollback - User should not be created');
    }

    // Validation: role_ids là required và không được rỗng
    const roleIds = userData.role_ids;
    if (!roleIds || roleIds.length === 0) {
      throw new Error('role_ids is required and must contain at least one role');
    }

    // Loại bỏ duplicate role_ids để tránh lỗi unique constraint
    const uniqueRoleIds = [...new Set(roleIds)];
    
    const roles = await Role.findAll({
      where: { id: uniqueRoleIds },
    });

    // Kiểm tra xem tất cả role_ids có tồn tại không
    if (roles.length !== uniqueRoleIds.length) {
      const foundRoleIds = roles.map((r) => r.id);
      const missingRoleIds = uniqueRoleIds.filter((id) => !foundRoleIds.includes(id));
      throw new Error(`Roles with IDs [${missingRoleIds.join(', ')}] not found`);
    }

    // Tạo UserRole records trực tiếp
    const now = new Date();
    await UserRole.bulkCreate(
      roles.map((role) => ({
        userId: user.id,
        roleId: role.id,
        createdAt: now,
        updatedAt: now,
      }))
    );

    // Load roles để trả về
    // required: true để chỉ lấy user có role (INNER JOIN)
    const userWithRoles = await User.findByPk(user.id, {
      attributes: ['id', 'firstName', 'lastName', 'birthDate', 'gender'],
      include: [{ 
        model: Role, 
        as: 'roles',
        required: true, // INNER JOIN - chỉ lấy user có role
        attributes: ['id', 'roleName'],
      }],
    });

    if (!userWithRoles) {
      throw new Error('User created but could not be retrieved');
    }

    return this.mapToUserResponse(userWithRoles as User);
  }

  async getUserById(id: number): Promise<UserResponse | null> {
    // paranoid: false để lấy cả user đã bị soft delete (admin cần xem detail của disabled users)
    // required: true để chỉ lấy user có role (INNER JOIN)
    const user = await User.findByPk(id, {
      paranoid: false, // Lấy cả user đã bị soft delete
      attributes: ['id', 'cognitoUserId', 'firstName', 'lastName', 'birthDate', 'gender', 'deletedAt'],
      include: [{ 
        model: Role, 
        as: 'roles', 
        required: true, // INNER JOIN - chỉ lấy user có role
        attributes: ['id', 'roleName'],
      }],
    });
    return user ? this.mapToUserResponse(user) : null;
  }

  async getUserByCognitoUserId(cognitoUserId: string): Promise<UserResponse | null> {
    // Paranoid tự động filter deleted_at IS NULL
    // required: false để lấy cả user chưa có role (LEFT JOIN) - user có thể chưa có profile
    const user = await User.findOne({
      where: {
        cognitoUserId: cognitoUserId,
      },
      attributes: ['id', 'cognitoUserId', 'firstName', 'lastName', 'birthDate', 'gender'],
      include: [{ 
        model: Role, 
        as: 'roles',
        required: false, // LEFT JOIN - lấy cả user chưa có role
        attributes: ['id', 'roleName'],
      }],
    });
    return user ? this.mapToUserResponse(user) : null;
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilterParams = {}
  ): Promise<PaginatedResponse<UserResponse>> {
    // Validate và set default values
    const pageNumber = Math.max(1, page);
    // Nếu limit=0, không áp dụng pagination (lấy tất cả)
    const noPagination = limit === 0;
    // Chỉ tính pageSize và offset khi có pagination
    const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit)); // Max 100 records per page
    const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;

    // Xây dựng WHERE clause cho filter
    const whereConditions: Array<Record<string, unknown>> = [];

    // Filter by search (tìm trong cả firstname và lastname với OR)
    if (filters.search && filters.search.trim()) {
      whereConditions.push(buildSearchCondition(filters.search));
    }

    // Filter by first_name (có thể kết hợp với search)
    if (filters.first_name && filters.first_name.trim()) {
      const firstNameFilter = filters.first_name.trim();
      const firstNameCondition = { firstName: { [Op.like]: `%${firstNameFilter}%` } };
      whereConditions.push(firstNameCondition);
    }

    // Filter by last_name (có thể kết hợp với search và first_name)
    if (filters.last_name && filters.last_name.trim()) {
      const lastNameFilter = filters.last_name.trim();
      const lastNameCondition = { lastName: { [Op.like]: `%${lastNameFilter}%` } };
      whereConditions.push(lastNameCondition);
    }

    // Filter by birth_date_from (từ ngày này trở đi)
    if (filters.birth_date_from && filters.birth_date_from.trim()) {
      const fromDate = new Date(filters.birth_date_from);
      whereConditions.push({
        birthDate: {
          [Op.gte]: fromDate, // greater than or equal
        },
      });
    }

    // Filter by birth_date_to (đến ngày này)
    if (filters.birth_date_to && filters.birth_date_to.trim()) {
      const toDate = new Date(filters.birth_date_to);
      // Set time to end of day (23:59:59.999)
      toDate.setHours(23, 59, 59, 999);
      whereConditions.push({
        birthDate: {
          [Op.lte]: toDate, // less than or equal
        },
      });
    }

    // Filter by gender
    if (filters.gender) {
      whereConditions.push({
        gender: filters.gender,
      });
    }

    // Kết hợp tất cả điều kiện với AND
    // Nếu chỉ có 1 điều kiện, không cần wrap trong Op.and
    let whereClause: Record<string, unknown> | undefined;
    if (whereConditions.length === 1) {
      whereClause = whereConditions[0];
    } else if (whereConditions.length > 1) {
      whereClause = { [Op.and]: whereConditions };
    }

    // Build attributes và includes từ query params
    const attributes = buildAttributes(filters.fields);
    const includeDefs = buildInclude(filters.include);

    // Build query options với dynamic attributes và includes
    const queryOptions: {
      where?: Record<string, unknown>;
      order: Array<[string, string]>;
      limit?: number;
      offset?: number;
      paranoid?: boolean;
      attributes?: string[];
      include?: any[];
      distinct?: boolean;
    } = {
      order: [['id', 'DESC']],
      paranoid: filters.include_deleted === true ? false : true,
      distinct: true, // Tránh count trùng khi JOIN
    };

    // Chỉ thêm attributes nếu có (nếu không Sequelize sẽ SELECT *)
    if (attributes) {
      queryOptions.attributes = attributes;
    }

    // Chỉ thêm include nếu có
    if (includeDefs) {
      queryOptions.include = includeDefs;
      // Đảm bảo roles include có required: true để chỉ lấy user có role
      queryOptions.include = queryOptions.include.map((inc: any) => {
        if (inc.model === Role || (inc.as && inc.as === 'roles')) {
          return { ...inc, required: true }; // INNER JOIN - chỉ lấy user có role
        }
        return inc;
      });
    } else {
      // Nếu không có include từ query params, thêm roles include mặc định với required: true
      queryOptions.include = [{
        model: Role,
        as: 'roles',
        required: true, // INNER JOIN - chỉ lấy user có role
        attributes: ['id', 'roleName'],
      }];
    }

    // Nếu limit=0, không áp dụng pagination
    // KHÔNG set limit và offset trong queryOptions → Sequelize sẽ KHÔNG thêm LIMIT vào SQL
    // Database sẽ trả về TẤT CẢ records match với filters (không có giới hạn)
    if (!noPagination) {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }
    // Khi noPagination = true, KHÔNG set limit và offset → Sequelize không thêm LIMIT clause vào SQL

    // Chỉ thêm where clause nếu có filter
    if (whereClause) {
      queryOptions.where = whereClause;
    }

    // Dùng findAndCountAll để lấy cả data và count trong 1 query (hiệu quả hơn)
    const { rows: users, count: total } = await User.findAndCountAll(queryOptions);

    // Tính pagination
    const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
    const responseLimit = noPagination ? total : pageSize;

    return {
      data: users.map((user) => this.mapToUserResponse(user)),
      pagination: noPagination
        ? {
            page: 1,
            limit: total,
            total,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        : {
            page: pageNumber,
            limit: responseLimit,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
          },
    };
  }

  async updateUser(
    id: number, 
    userData: UpdateUserDto,
    opts?: { transaction?: Transaction }
  ): Promise<UserResponse | null> {
    // Nếu có transaction từ opts, wrap trong CLS namespace và gọi trực tiếp internal method
    if (opts?.transaction) {
      return withExistingTransaction(opts.transaction, async (t) => {
        return this._updateUserInternal(id, userData, t);
      }).catch((error) => {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          return null;
        }
        throw error;
      });
    }

    // Nếu không có transaction từ opts, dùng decorator để tạo transaction mới
    // _updateUserInternal() sẽ tự check user tồn tại, không cần check trước
    return this._updateUserWithTransaction(id, userData).catch((error) => {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        return null;
      }
      throw error;
    });
  }

  @Transactional()
  private async _updateUserWithTransaction(
    id: number,
    userData: UpdateUserDto
  ): Promise<UserResponse> {
    // Transaction tự động được set vào CLS namespace bởi Sequelize (qua @Transactional decorator)
    // Lấy transaction từ namespace để truyền vào _updateUserInternal
    const transaction = getTransaction();
    if (!transaction) {
      throw new Error('Transaction not found in CLS namespace');
    }
    return this._updateUserInternal(id, userData, transaction);
  }

  private async _updateUserInternal(
    id: number,
    userData: UpdateUserDto,
    _t: Transaction // Với CLS, transaction tự động được truyền vào tất cả queries
  ): Promise<UserResponse> {
    // Paranoid tự động filter deleted_at IS NULL
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('USER_NOT_FOUND'); // Dùng error để phân biệt với lỗi khác
    }

    const updateData: Partial<UserAttributes> = {};
    
    // first_name: chỉ update nếu có giá trị hợp lệ (không null, không empty)
    if (userData.first_name !== undefined && userData.first_name !== null && userData.first_name.trim().length > 0) {
      updateData.firstName = userData.first_name.trim();
    }
    
    // last_name: chỉ update nếu có giá trị hợp lệ (không null, không empty)
    if (userData.last_name !== undefined && userData.last_name !== null && userData.last_name.trim().length > 0) {
      updateData.lastName = userData.last_name.trim();
    }
    
    if (userData.birth_date !== undefined) {
      updateData.birthDate = userData.birth_date ? new Date(userData.birth_date) : null;
    }
    
    if (userData.gender !== undefined) {
      updateData.gender = userData.gender;
    }
    
    if (userData.updated_by !== undefined) {
      updateData.updatedBy = userData.updated_by;
    }

    // Chỉ update nếu có thay đổi
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData, {
        fields: Object.keys(updateData) as Array<keyof UserAttributes>,
      });
    }

    // Cập nhật roles nếu có
    if (userData.role_ids !== undefined) {
      // Xóa tất cả roles hiện tại trước
      await UserRole.destroy({
        where: { userId: user.id },
      });

      // Thêm roles mới nếu có
      if (userData.role_ids.length > 0) {
        // Loại bỏ duplicate role_ids để tránh lỗi unique constraint
        const uniqueRoleIds = [...new Set(userData.role_ids)];
        
        const roles = await Role.findAll({
          where: { id: uniqueRoleIds },
        });

        // Kiểm tra xem tất cả role_ids có tồn tại không
        if (roles.length !== uniqueRoleIds.length) {
          const foundRoleIds = roles.map((r) => r.id);
          const missingRoleIds = uniqueRoleIds.filter((id) => !foundRoleIds.includes(id));
          throw new Error(`Roles with IDs [${missingRoleIds.join(', ')}] not found`);
        }

        // Tạo UserRole records trực tiếp
        const now = new Date();
        await UserRole.bulkCreate(
          roles.map((role) => ({
            userId: user.id,
            roleId: role.id,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
    }

    // Load lại với roles
    // required: true để chỉ lấy user có role (INNER JOIN)
    const updatedUser = await User.findByPk(user.id, {
      attributes: ['id', 'firstName', 'lastName', 'birthDate', 'gender'],
      include: [{ 
        model: Role, 
        as: 'roles',
        required: true, // INNER JOIN - chỉ lấy user có role
        attributes: ['id', 'roleName'],
      }],
    });

    if (!updatedUser) {
      throw new Error('User updated but could not be retrieved');
    }

    return this.mapToUserResponse(updatedUser);
  }

  async deleteUser(id: number): Promise<boolean> {
    // Paranoid tự động filter deleted_at IS NULL
    // Chỉ cần id để delete, không cần select nhiều fields
    const user = await User.findByPk(id, {
      attributes: ['id'],
    });
    if (!user) {
      return false;
    }

    // Soft delete - Sequelize tự động set deleted_at = NOW()
    await user.destroy();
    return true;
  }

  async hardDeleteUser(id: number): Promise<boolean> {
    // Tìm cả record đã bị xóa (paranoid: false)
    // Chỉ cần id để delete, không cần select nhiều fields
    const user = await User.findByPk(id, { 
      paranoid: false,
      attributes: ['id'],
    });
    if (!user) {
      return false;
    }

    // Hard delete - xóa thật khỏi database
    await user.destroy({ force: true });
    return true;
  }

  async restoreUser(id: number): Promise<boolean> {
    // Tìm cả user đã bị xóa (paranoid: false)
    // Cần deletedAt để check xem user có đang bị xóa không
    const user = await User.findByPk(id, { 
      paranoid: false,
      attributes: ['id', 'deletedAt'],
    });
    if (!user) {
      return false;
    }

    // Kiểm tra user có đang bị xóa không (deletedAt !== null)
    if (!user.deletedAt) {
      return false; // User chưa bị xóa
    }

    // Restore user - Sequelize tự động set deleted_at = NULL
    await user.restore();
    return true;
  }

  private mapToUserResponse(user: User): UserResponse {
    // Sequelize tự động map tất cả các field từ model instance sang plain object
    // Vì đã dùng attributes trong query, plainUser chỉ chứa các field đã được select
    const plainUser = user.get({ plain: true }) as any;
    return {
      ...plainUser, 
      roles: plainUser.roles && Array.isArray(plainUser.roles)
        ? plainUser.roles.map((role: any) => ({
            id: role.id,
            roleName: role.roleName,
          }))
        : [], // Override roles để chỉ lấy id và roleName
    };
  }

  /**
   * Create or update user profile by Cognito userId
   * Nếu user đã có trong DB (tìm bằng cognito_user_id) → update
   * Nếu chưa có → create mới với role "user" mặc định
   */
  @Transactional()
  async createOrUpdateProfile(
    cognitoUserId: string,
    userData: CreateUserDto | UpdateUserDto
  ): Promise<UserResponse> {
    // Tìm user hiện tại bằng cognito_user_id
    const existingUser = await User.findOne({
      where: {
        cognitoUserId: cognitoUserId,
      },
    });

    if (existingUser) {
      // User đã có profile → update (không update role, chỉ update thông tin cá nhân)
      const transaction = getTransaction();
      if (!transaction) {
        throw new Error('Transaction not found in CLS namespace');
      }
      // Tạo UpdateUserDto không có role_ids để user không thể tự update role
      const updateData: UpdateUserDto = {};
      if (userData.first_name !== undefined) {
        updateData.first_name = userData.first_name;
      }
      if (userData.last_name !== undefined) {
        updateData.last_name = userData.last_name;
      }
      if (userData.birth_date !== undefined) {
        updateData.birth_date = userData.birth_date;
      }
      if (userData.gender !== undefined) {
        updateData.gender = userData.gender;
      }
      // Không include role_ids - user không được tự update role
      const updatedUser = await this._updateUserInternal(existingUser.id, updateData, transaction);
      return updatedUser;
    } else {
      // User chưa có profile → create mới với role "user" mặc định
      // Tìm role "user" (case-insensitive - dùng LOWER() cho MySQL)
      let userRole = await Role.findOne({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('role_name')),
          'user'
        ),
      });

      // Nếu không tìm thấy với case-insensitive, thử tìm exact match
      if (!userRole) {
        userRole = await Role.findOne({
          where: {
            [Op.or]: [
              { roleName: 'user' },
              { roleName: 'User' },
              { roleName: 'USER' },
            ],
          },
        });
      }

      // Nếu vẫn không tìm thấy, tạo mới role "user"
      if (!userRole) {
        userRole = await Role.create({
          roleName: 'user',
          description: 'Regular user',
        });
      }

      const newUserData: CreateUserDto = {
        ...userData,
        cognito_user_id: cognitoUserId, // Set cognito_user_id từ token
        role_ids: [userRole.id], // Tự động assign role "user" mặc định
      };
      return this.createUser(newUserData);
    }
  }
}

export default new UserService();
