# Backend Design

## API Design Principles

The React CMS Backend follows RESTful API design principles with Laravel as the framework.

### Key Characteristics
- **Resource-Based**: Endpoints represent resources (users, roles, menus, company, etc.)
- **Standard HTTP Methods**: 
  - `GET` for retrieving resources
  - `POST` for creating resources
  - `PUT/PATCH` for updating resources
  - `DELETE` for removing resources
- **Consistent Response Format**: All API responses follow a standardized JSON structure
- **Stateless Authentication**: Uses Laravel Sanctum tokens (stateless, token-based authentication)
- **Versioning**: API version is implicit in the URL (`/api`) - future versions could use `/api/v1`, `/api/v2`

### Response Format
All successful responses return:
```json
{
  "data": {},          // Resource data or collection
  "message": "Success message",
  "errors": null
}
```

Error responses return:
```json
{
  "data": null,
  "message": "Error message",
  "errors": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message"]
  }
}
```

Validation errors (422) include field-specific error messages.

### Authentication
- Uses Laravel Sanctum for token-based authentication
- Tokens are transmitted via `Authorization: Bearer <token>` header
- Protected routes use `auth:sanctum` middleware
- Token expiration configurable via `SANCTUM_EXPIRATION` (default 480 minutes)
- Stateful domains configured via `SANCTUM_STATEFUL_DOMAINS` for SPA authentication

### Route Structure
- **Auth**: 
  - `POST /api/login` - Authenticate user
  - `GET /api/me` - Get authenticated user data
  - `POST /api/logout` - Invalidate token
- **Users**: 
  - `GET /api/users` - List users (paginated)
  - `POST /api/users` - Create user
  - `GET /api/users/{id}` - Get user details
  - `PUT /api/users/{id}` - Update user
  - `DELETE /api/users/{id}` - Delete user
- **Roles**: Similar CRUD endpoints under `/api/roles`
- **Menus**: 
  - `GET /api/menus` - List menus
  - `POST /api/menus` - Create menu
  - `GET /api/menus/tree` - Get hierarchical menu structure (role-based)
  - Plus standard CRUD operations
- **Permissions**: 
  - `GET /api/role-menus/{role}` - Get permissions for a role
  - `POST /api/role-menus/{role}` - Update permissions for a role
- **Company**: 
  - `GET /api/company` - Get company settings
  - `PUT /api/company` - Update company settings
- **Dashboard**: 
  - `GET /api/dashboard-summary` - Get dashboard statistics

### Database Design
- Uses Eloquent ORM with MySQL/MariaDB/SQLite
- Key tables:
  - `users` - Authentication and user profile
  - `roles` - Role definitions (name, guard_name)
  - `menus` - Menu items (title, icon, route, parent_id, order)
  - `role_menus` - Pivot table linking roles to menus (permissions)
  - `companies` - Company information (name, address, logo, favicon)
  - `personal_access_tokens` - Sanctum tokens
  - Standard Laravel tables (migrations, cache, sessions, etc.)

### Security Considerations
- **CORS**: Configured via environment variables to restrict allowed origins
- **Input Validation**: All requests validated via Form Requests or controller validation
- **Authorization**: Policy-based or gate checks for resource access (where implemented)
- **Rate Limiting**: Can be applied via middleware (not enabled by default)
- **Headers**: Security headers can be added via middleware (consider for production)
- **Data Protection**: Sensitive data (like passwords) hashed using bcrypt

### OpenAPI (Swagger) Documentation
- Automatically generated from PHPDoc annotations in controllers
- Accessible at:
  - Swagger UI: `/api/documentation`
  - JSON: `/docs?jsonFile=api-docs.json`
- Annotations follow `zircote/swagger-php` conventions
- To regenerate: `php artisan l5-swagger:generate`

### Performance & Scalability
- **Database Indexes**: Proper indexing on foreign keys and frequently queried columns
- **Eager Loading**: Relationships loaded efficiently to avoid N+1 problems
- **Caching**: Configuration, routes, and views cached in production
- **Queue Support**: Time-consuming tasks can be queued (database queue driver by default)
- **File Storage**: Uses Laravel's filesystem abstraction (local disk by default)

### Error Handling
- Exceptions caught and formatted into standard JSON error responses
- Validation errors automatically formatted by Laravel
- Custom exception handlers can be added in `app/Exceptions/Handler.php`
- Logging: Errors logged to daily files (configurable via `LOG_CHANNEL`)

### Development Guidelines
- Follow Laravel PSR-4 autoloading and coding standards
- Controllers should be thin; business logic in services or models
- Use Eloquent relationships where appropriate
- Validate all incoming data (never trust client input)
- Keep API responses consistent and predictable
- Write unit and feature tests for critical functionality
- Document API changes in OpenAPI annotations

### Deployment Considerations
- Environment-specific configuration via `.env` files
- Production should use:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - Secure database connection (SSL/TLS if remote)
  - Restricted CORS origins
  - HTTPS termination at reverse proxy (nginx)
  - Supervisor to manage PHP-FPM and Nginx processes
- Log rotation configured via `LOG_DAILY_DAYS`
- Backup strategy for database and uploaded assets