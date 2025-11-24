import type { Request, Response } from 'express';
export declare class RoleController {
    createRole(req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<void>;
    getAllRoles(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
    hardDeleteRole(req: Request, res: Response): Promise<void>;
    restoreRole(req: Request, res: Response): Promise<void>;
}
declare const _default: RoleController;
export default _default;
//# sourceMappingURL=roleController.d.ts.map