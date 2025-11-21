# Cấu trúc thư mục Frontend User Service

Cấu trúc này được thiết kế dựa trên backend `user-service` với các module chính:
- Auth (Authentication)
- Users (User Management)
- Roles (Role Management)
- Products (Product Management)
- Orders (Order Management)

## Cấu trúc thư mục

```
src/
├── app/
│   ├── core/                          # Core module - chỉ import 1 lần trong AppModule
│   │   ├── config/                    # Configuration files
│   │   │   ├── api.config.ts         # API base URL, endpoints
│   │   │   ├── amplify.config.ts     # AWS Amplify config (nếu dùng)
│   │   │   └── app.config.ts         # App-wide configuration
│   │   ├── guards/                    # Route guards
│   │   │   ├── auth.guard.ts         # Authentication guard
│   │   │   ├── admin.guard.ts        # Admin permission guard
│   │   │   ├── guest.guard.ts        # Guest guard (chưa login)
│   │   │   └── profile.guard.ts      # Profile validation guard
│   │   ├── interceptors/             # HTTP interceptors
│   │   │   ├── auth.interceptor.ts   # Add auth token to requests
│   │   │   ├── error.interceptor.ts  # Global error handling
│   │   │   └── loading.interceptor.ts # Loading indicator
│   │   ├── services/                 # Core services
│   │   │   ├── api.service.ts        # Base API service
│   │   │   ├── auth.service.ts       # Authentication service
│   │   │   └── storage.service.ts    # Local storage service
│   │   ├── models/                   # Core models/interfaces
│   │   │   ├── api-response.model.ts # API response structure
│   │   │   ├── user.model.ts         # User model
│   │   │   └── pagination.model.ts   # Pagination model
│   │   └── utils/                    # Core utilities
│   │       ├── error-handler.util.ts
│   │       └── date.util.ts
│   │
│   ├── features/                      # Feature modules (lazy loading)
│   │   ├── auth/                     # Authentication feature
│   │   │   ├── components/
│   │   │   │   ├── signin/          # Sign in component
│   │   │   │   ├── signup/          # Sign up component
│   │   │   │   └── confirm-email/   # Email confirmation
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts  # Auth feature service
│   │   │   ├── models/
│   │   │   │   └── auth.model.ts    # Auth-specific models
│   │   │   └── auth.routes.ts       # Auth routes
│   │   │
│   │   ├── users/                    # User management feature
│   │   │   ├── components/
│   │   │   │   ├── user-list/       # User list component
│   │   │   │   ├── user-detail/     # User detail component
│   │   │   │   ├── user-form/       # User create/edit form
│   │   │   │   ├── profile/         # User profile component
│   │   │   │   ├── edit-account/    # Edit account info
│   │   │   │   ├── edit-password/   # Change password
│   │   │   │   └── edit-personal/   # Edit personal info
│   │   │   ├── services/
│   │   │   │   └── user.service.ts  # User API service
│   │   │   ├── models/
│   │   │   │   └── user.model.ts    # User models
│   │   │   └── utils/
│   │   │       └── user.utils.ts    # User utilities
│   │   │
│   │   ├── roles/                    # Role management feature
│   │   │   ├── components/
│   │   │   │   ├── role-list/       # Role list component
│   │   │   │   ├── role-detail/     # Role detail component
│   │   │   │   └── role-form/       # Role create/edit form
│   │   │   ├── services/
│   │   │   │   └── role.service.ts  # Role API service
│   │   │   └── models/
│   │   │       └── role.model.ts    # Role models
│   │   │
│   │   ├── products/                 # Product management feature
│   │   │   ├── components/
│   │   │   │   ├── product-list/    # Product list component
│   │   │   │   ├── product-detail/  # Product detail component
│   │   │   │   └── product-form/    # Product create/edit form
│   │   │   ├── services/
│   │   │   │   └── product.service.ts # Product API service
│   │   │   └── models/
│   │   │       └── product.model.ts # Product models
│   │   │
│   │   └── orders/                   # Order management feature
│   │       ├── components/
│   │       │   ├── order-list/      # Order list component
│   │       │   ├── order-detail/    # Order detail component
│   │       │   └── order-form/      # Order create/edit form
│   │       ├── services/
│   │       │   └── order.service.ts # Order API service
│   │       └── models/
│   │           └── order.model.ts   # Order models
│   │
│   ├── store/                        # NgRx store (state management)
│   │   ├── index.ts                 # Store configuration
│   │   ├── auth/                    # Auth state
│   │   │   ├── actions/
│   │   │   │   └── auth.actions.ts
│   │   │   ├── effects/
│   │   │   │   └── auth.effects.ts
│   │   │   ├── reducers/
│   │   │   │   └── auth.reducer.ts
│   │   │   ├── selectors/
│   │   │   │   └── auth.selectors.ts
│   │   │   └── state/
│   │   │       └── auth.state.ts
│   │   ├── users/                   # Users state
│   │   │   ├── actions/
│   │   │   │   └── users.actions.ts
│   │   │   ├── effects/
│   │   │   │   └── users.effects.ts
│   │   │   ├── reducers/
│   │   │   │   └── users.reducer.ts
│   │   │   ├── selectors/
│   │   │   │   └── users.selectors.ts
│   │   │   └── state/
│   │   │       └── users.state.ts
│   │   ├── roles/                   # Roles state
│   │   │   ├── actions/
│   │   │   │   └── roles.actions.ts
│   │   │   ├── effects/
│   │   │   │   └── roles.effects.ts
│   │   │   ├── reducers/
│   │   │   │   └── roles.reducer.ts
│   │   │   ├── selectors/
│   │   │   │   └── roles.selectors.ts
│   │   │   └── state/
│   │   │       └── roles.state.ts
│   │   ├── products/                # Products state
│   │   │   ├── actions/
│   │   │   │   └── products.actions.ts
│   │   │   ├── effects/
│   │   │   │   └── products.effects.ts
│   │   │   ├── reducers/
│   │   │   │   └── products.reducer.ts
│   │   │   ├── selectors/
│   │   │   │   └── products.selectors.ts
│   │   │   └── state/
│   │   │       └── products.state.ts
│   │   └── orders/                  # Orders state
│   │       ├── actions/
│   │       │   └── orders.actions.ts
│   │       ├── effects/
│   │       │   └── orders.effects.ts
│   │       ├── reducers/
│   │       │   └── orders.reducer.ts
│   │       ├── selectors/
│   │       │   └── orders.selectors.ts
│   │       └── state/
│   │           └── orders.state.ts
│   │
│   ├── shared/                       # Shared components, directives, pipes
│   │   ├── components/
│   │   │   ├── loading-spinner/     # Loading spinner
│   │   │   ├── error-message/       # Error message display
│   │   │   ├── confirm-dialog/      # Confirmation dialog
│   │   │   ├── pagination/          # Pagination component
│   │   │   └── table/               # Reusable table component
│   │   ├── directives/
│   │   │   └── has-permission.directive.ts # Permission directive
│   │   ├── pipes/
│   │   │   ├── date-format.pipe.ts
│   │   │   └── truncate.pipe.ts
│   │   └── models/
│   │       └── shared.model.ts
│   │
│   ├── layout/                       # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   └── main-layout/
│   │
│   ├── pages/                        # Page-level components
│   │   ├── homepage/
│   │   ├── not-found/
│   │   └── permission-denied/
│   │
│   ├── app.routes.ts                 # Main routing configuration
│   ├── app.config.ts                 # App configuration
│   └── app.component.ts              # Root component
│
├── assets/                           # Static assets
│   ├── images/
│   ├── icons/
│   └── styles/
│
├── environments/                     # Environment configurations
│   ├── environment.ts               # Development
│   └── environment.prod.ts          # Production
│
├── index.html
├── main.ts
└── styles.css                        # Global styles
```

## Mapping với Backend

### Backend Routes → Frontend Features

| Backend Route | Frontend Feature | Components |
|--------------|------------------|------------|
| `/api/auth` | `features/auth` | signin, signup, confirm-email |
| `/api/users` | `features/users` | user-list, user-detail, profile, edit-account, edit-password, edit-personal |
| `/api/roles` | `features/roles` | role-list, role-detail, role-form |
| `/api/products` | `features/products` | product-list, product-detail, product-form |
| `/api/orders` | `features/orders` | order-list, order-detail, order-form |

### Backend Controllers → Frontend Services

| Backend Controller | Frontend Service |
|-------------------|------------------|
| `authController` | `core/services/auth.service.ts` |
| `userController` | `features/users/services/user.service.ts` |
| `accountController` | `features/users/services/user.service.ts` (account methods) |
| `roleController` | `features/roles/services/role.service.ts` |
| `productController` | `features/products/services/product.service.ts` |
| `orderController` | `features/orders/services/order.service.ts` |

## Best Practices

1. **Feature Module Structure**: Mỗi feature module nên có:
   - Components cho UI
   - Services cho API calls
   - Models cho type definitions
   - Routes cho routing (lazy loading)

2. **State Management**: Sử dụng NgRx cho:
   - Auth state (user session, tokens)
   - List states (users, roles, products, orders)
   - Complex state management

3. **Lazy Loading**: Tất cả features nên được lazy load để tối ưu performance

4. **Reusability**: 
   - Shared components cho UI elements chung
   - Core services cho business logic chung
   - Utils cho helper functions

5. **Type Safety**: 
   - Sử dụng TypeScript interfaces/models
   - Match với backend types khi có thể

