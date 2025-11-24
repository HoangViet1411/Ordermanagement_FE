import type { Request, Response } from 'express';
export declare class UserController {
    createUser(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    getAllUsers(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    hardDeleteUser(req: Request, res: Response): Promise<void>;
    restoreUser(req: Request, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=userController.d.ts.map