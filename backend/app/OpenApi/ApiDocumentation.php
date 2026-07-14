<?php

namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="React CMS API",
 *     version="1.0.0",
 *     description="OpenAPI documentation for the React CMS backend."
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Configured from APP_URL + /api"
 * )
 *
 * @OA\Tag(name="Auth", description="Authentication and token management")
 * @OA\Tag(name="Users", description="User account management")
 * @OA\Tag(name="Roles", description="Role management")
 * @OA\Tag(name="Menus", description="Menu and sidebar management")
 * @OA\Tag(name="Role Permissions", description="Dynamic sidebar permission system")
 * @OA\Tag(name="Company", description="Company profile and branding")
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="Sanctum token",
 *     description="Use the token from /login as: Bearer {token}"
 * )
 *
 * @OA\Schema(
 *     schema="ApiSuccess",
 *
 *     @OA\Property(property="data", nullable=true),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="ApiError",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="The given data was invalid."),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         nullable=true,
 *         additionalProperties=@OA\AdditionalProperties(type="array", @OA\Items(type="string"))
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="ApiMetaResponse",
 *
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="ValidationErrorResponse",
 *     allOf={@OA\Schema(ref="#/components/schemas/ApiError")}
 * )
 * @OA\Schema(
 *     schema="AuthUser",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Admin"),
 *     @OA\Property(property="email", type="string", format="email", example="admin@gmail.com"),
 *     @OA\Property(property="role_id", type="integer", nullable=true, example=1)
 * )
 *
 * @OA\Schema(
 *     schema="LoginRequest",
 *     required={"email","password"},
 *
 *     @OA\Property(property="email", type="string", format="email", example="admin@gmail.com"),
 *     @OA\Property(property="password", type="string", format="password", example="password")
 * )
 *
 * @OA\Schema(
 *     schema="LoginSuccessResponse",
 *
 *     @OA\Property(
 *         property="data",
 *         type="object",
 *         @OA\Property(property="token", type="string", example="1|xxxxx"),
 *         @OA\Property(property="user", ref="#/components/schemas/AuthUser"),
 *         @OA\Property(property="company", ref="#/components/schemas/Company", nullable=true),
 *         @OA\Property(
 *             property="navigation",
 *             type="array",
 *
 *             @OA\Items(ref="#/components/schemas/RoleMenuTree")
 *         )
 *     ),
 *
 *     @OA\Property(property="message", type="string", example="Login successful"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="LoginUnauthorizedResponse",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="Invalid credentials"),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         @OA\Property(
 *             property="auth",
 *             type="array",
 *
 *             @OA\Items(type="string", example="Email or password incorrect")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="MeResponse",
 *
 *     @OA\Property(
 *         property="data",
 *         type="object",
 *         @OA\Property(property="user", ref="#/components/schemas/AuthUser"),
 *         @OA\Property(property="company", ref="#/components/schemas/Company", nullable=true),
 *         @OA\Property(
 *             property="navigation",
 *             type="array",
 *
 *             @OA\Items(ref="#/components/schemas/RoleMenuTree")
 *         )
 *     ),
 *
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="LogoutResponse",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="Logged out"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="Role",
 *
 *     @OA\Property(property="role_id", type="integer", example=1),
 *     @OA\Property(property="role_name", type="string", example="Administrator")
 * )
 *
 * @OA\Schema(
 *     schema="RoleModel",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="role_name", type="string", example="Administrator"),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="RoleRequest",
 *     required={"role_name"},
 *
 *     @OA\Property(property="role_name", type="string", example="Administrator")
 * )
 *
 * @OA\Schema(
 *     schema="RolesListResponse",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Role")),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="RoleResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/Role"),
 *     @OA\Property(property="message", type="string", example="Role updated"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="RoleDeleteResponse",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="Role deleted"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="User",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Admin"),
 *     @OA\Property(property="email", type="string", format="email", example="admin@example.com"),
 *     @OA\Property(property="email_verified_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="role_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="role", ref="#/components/schemas/RoleModel", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="UserCreateRequest",
 *     required={"name","email","password","role_id"},
 *
 *     @OA\Property(property="name", type="string", example="Editor"),
 *     @OA\Property(property="email", type="string", format="email", example="editor@example.com"),
 *     @OA\Property(property="password", type="string", format="password", minLength=6, example="secret123"),
 *     @OA\Property(property="role_id", type="integer", example=1)
 * )
 *
 * @OA\Schema(
 *     schema="UserUpdateRequest",
 *     required={"name","email"},
 *
 *     @OA\Property(property="name", type="string", example="Editor Updated"),
 *     @OA\Property(property="email", type="string", format="email", example="editor@example.com"),
 *     @OA\Property(property="password", type="string", format="password", nullable=true, minLength=6, example="newsecret123"),
 *     @OA\Property(property="role_id", type="integer", nullable=true, example=1)
 * )
 *
 * @OA\Schema(
 *     schema="UsersListResponse",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/User")),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="UserResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/User"),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="UserDeleteResponse",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="User deleted"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="ChangePasswordRequest",
 *     required={"current_password","new_password","confirm_password"},
 *
 *     @OA\Property(property="current_password", type="string", format="password", example="secret123"),
 *     @OA\Property(property="new_password", type="string", format="password", minLength=6, example="newsecret123"),
 *     @OA\Property(property="confirm_password", type="string", format="password", example="newsecret123")
 * )
 *
 * @OA\Schema(
 *     schema="ChangePasswordResponse",
 *
 *     @OA\Property(property="data", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", example="Password updated"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="Company",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="comp_name", type="string", example="React CMS"),
 *     @OA\Property(
 *         property="comp_logo",
 *         type="string",
 *         nullable=true,
 *         description="Logo image as a base64 data URL.",
 *         example="data:image/png;base64,iVBORw0KGgo..."
 *     ),
 *     @OA\Property(
 *         property="fav_icon",
 *         type="string",
 *         nullable=true,
 *         description="Favicon image as a base64 data URL.",
 *         example="data:image/png;base64,iVBORw0KGgo..."
 *     ),
 *     @OA\Property(property="app_title", type="string", nullable=true, example="React CMS"),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="CompanyRequest",
 *     required={"comp_name"},
 *
 *     @OA\Property(property="comp_name", type="string", example="React CMS"),
 *     @OA\Property(property="app_title", type="string", nullable=true, example="React CMS"),
 *     @OA\Property(
 *         property="comp_logo",
 *         type="string",
 *         nullable=true,
 *         description="Logo image as a base64 data URL. Example format: data:image/png;base64,{base64}.",
 *         example="data:image/png;base64,iVBORw0KGgo..."
 *     ),
 *     @OA\Property(
 *         property="fav_icon",
 *         type="string",
 *         nullable=true,
 *         description="Favicon image as a base64 data URL. Example format: data:image/png;base64,{base64}.",
 *         example="data:image/png;base64,iVBORw0KGgo..."
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="CompanyResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/Company", nullable=true),
 *     @OA\Property(property="message", type="string", example="Updated"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="Menu",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="menu_id", type="integer", example=1),
 *     @OA\Property(property="menu_name", type="string", example="Dashboard"),
 *     @OA\Property(property="menu_path", type="string", example="/dashboard"),
 *     @OA\Property(property="menu_icon", type="string", nullable=true, example="cil-speedometer"),
 *     @OA\Property(property="menu_parent_id", type="integer", nullable=true, example=null),
 *     @OA\Property(property="menu_order", type="integer", nullable=true, example=1),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="MenuRequest",
 *     required={"menu_name","menu_path"},
 *
 *     @OA\Property(property="menu_name", type="string", example="Dashboard"),
 *     @OA\Property(property="menu_path", type="string", example="/dashboard"),
 *     @OA\Property(property="menu_icon", type="string", nullable=true, example="cil-speedometer"),
 *     @OA\Property(property="menu_parent_id", type="integer", nullable=true, example=null),
 *     @OA\Property(property="menu_order", type="integer", nullable=true, example=1)
 * )
 *
 * @OA\Schema(
 *     schema="MenusListResponse",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Menu")),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="MenuResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/Menu"),
 *     @OA\Property(property="message", type="string", example="Updated"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="MenuDeleteResponse",
 *
 *     @OA\Property(property="data", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", example="Deleted"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="MenuTree",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/Menu"),
 *         @OA\Schema(
 *
 *             @OA\Property(
 *                 property="children",
 *                 type="array",
 *
 *                 @OA\Items(ref="#/components/schemas/MenuTree")
 *             )
 *         )
 *     }
 * )
 *
 * @OA\Schema(
 *     schema="MenuTreeResponse",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/MenuTree")),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="RoleMenuTree",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/Menu"),
 *         @OA\Schema(
 *
 *             @OA\Property(property="checked", type="boolean", example=true),
 *             @OA\Property(
 *                 property="children",
 *                 type="array",
 *
 *                 @OA\Items(ref="#/components/schemas/RoleMenuTree")
 *             )
 *         )
 *     }
 * )
 *
 * @OA\Schema(
 *     schema="RoleMenuTreeResponse",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/RoleMenuTree")),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="RoleMenuUpdateRequest",
 *     required={"menu_ids"},
 *
 *     @OA\Property(property="menu_ids", type="array", @OA\Items(type="integer"), example={1,2,3})
 * )
 *
 * @OA\Schema(
 *     schema="RoleMenuUpdateResponse",
 *
 *     @OA\Property(property="data", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", example="Permissions updated"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 */
class ApiDocumentation
{
    /**
     * @OA\Post(
     *     path="/login",
     *     tags={"Auth"},
     *     summary="Login and create a Sanctum token",
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/LoginRequest",
     *             example={"email":"admin@gmail.com","password":"password"}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/LoginSuccessResponse",
     *             example={
     *                 "data": {
     *                     "token": "1|xxxxx",
     *                     "user": {
     *                         "id": 1,
     *                         "name": "Admin",
     *                         "email": "admin@gmail.com",
     *                         "role_id": 1
     *                     }
     *                 },
     *                 "message": "Login successful",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/LoginUnauthorizedResponse",
     *             example={
     *                 "data": null,
     *                 "message": "Invalid credentials",
     *                 "errors": {
     *                     "auth": {
     *                         "Email or password incorrect"
     *                     }
     *                 }
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function login(): void {}

    /**
     * @OA\Get(
     *     path="/me",
     *     tags={"Auth"},
     *     summary="Get authenticated user",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Authenticated user",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MeResponse",
     *             example={
     *                 "data": {
     *                     "user": {
     *                         "id": 1,
     *                         "name": "Admin",
     *                         "email": "admin@gmail.com",
     *                         "role_id": 1
     *                     }
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/logout",
     *     tags={"Auth"},
     *     summary="Delete current Sanctum token",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Logged out",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/LogoutResponse",
     *             example={"data":null,"message":"Logged out","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     */
    public function authSession(): void {}

    /**
     * @OA\Get(
     *     path="/company",
     *     tags={"Company"},
     *     summary="Get company profile",
     *
     *     @OA\Response(
     *         response=200,
     *         description="Company profile",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/CompanyResponse",
     *             example={
     *                 "data": {
     *                     "comp_name": "React CMS",
     *                     "app_title": "React CMS",
     *                     "comp_logo": "data:image/png;base64,iVBORw0KGgo...",
     *                     "fav_icon": "data:image/png;base64,iVBORw0KGgo..."
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     )
     * )
     *
     * @OA\Put(
     *     path="/company",
     *     tags={"Company"},
     *     summary="Update company profile",
     *     description="Uploads logo and favicon as base64 data URL strings, for example data:image/png;base64,iVBORw0KGgo...",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/CompanyRequest",
     *             example={
     *                 "comp_name": "React CMS",
     *                 "app_title": "React CMS",
     *                 "comp_logo": "data:image/png;base64,iVBORw0KGgo...",
     *                 "fav_icon": "data:image/png;base64,iVBORw0KGgo..."
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/CompanyResponse",
     *             example={
     *                 "data": {
     *                     "comp_name": "React CMS",
     *                     "app_title": "React CMS",
     *                     "comp_logo": "data:image/png;base64,iVBORw0KGgo...",
     *                     "fav_icon": "data:image/png;base64,iVBORw0KGgo..."
     *                 },
     *                 "message": "Updated",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function company(): void {}

    /**
     * @OA\Get(
     *     path="/users",
     *     tags={"Users"},
     *     summary="List users",
     *     description="Returns a plain array of users. Pagination metadata is not returned by the current API.",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="User list",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UsersListResponse",
     *             example={
     *                 "data": {
     *                     {
     *                         "id": 1,
     *                         "name": "Admin",
     *                         "email": "admin@gmail.com",
     *                         "role_id": 1,
     *                         "role": {"id": 1, "role_name": "Administrator"}
     *                     },
     *                     {
     *                         "id": 2,
     *                         "name": "Editor",
     *                         "email": "editor@example.com",
     *                         "role_id": 2,
     *                         "role": {"id": 2, "role_name": "Editor"}
     *                     }
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/users",
     *     tags={"Users"},
     *     summary="Create user",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserCreateRequest",
     *             example={"name":"Editor","email":"editor@example.com","password":"secret123","role_id":2}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="User created",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserResponse",
     *             example={
     *                 "data": {"id": 2, "name": "Editor", "email": "editor@example.com", "role_id": 2},
     *                 "message": "User created",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ValidationErrorResponse",
     *             example={
     *                 "data": null,
     *                 "message": "The given data was invalid.",
     *                 "errors": {
     *                     "email": {"The email has already been taken."},
     *                     "password": {"The password field must be at least 6 characters."},
     *                     "role_id": {"The selected role id is invalid."}
     *                 }
     *             }
     *         )
     *     )
     * )
     */
    public function usersCollection(): void {}

    /**
     * @OA\Get(
     *     path="/users/{id}",
     *     tags={"Users"},
     *     summary="Get user detail",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="User ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="User detail",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserResponse",
     *             example={
     *                 "data": {
     *                     "id": 1,
     *                     "name": "Admin",
     *                     "email": "admin@gmail.com",
     *                     "role_id": 1,
     *                     "role": {"id": 1, "role_name": "Administrator"}
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/users/{id}",
     *     tags={"Users"},
     *     summary="Update user",
     *     description="Editable fields: name, email, password, and role_id. Password may be omitted when it should not be changed.",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="User ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserUpdateRequest",
     *             example={"name":"Editor Updated","email":"editor@example.com","role_id":2}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="User updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserResponse",
     *             example={
     *                 "data": {"id": 2, "name": "Editor Updated", "email": "editor@example.com", "role_id": 2},
     *                 "message": "User updated",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/users/{id}",
     *     tags={"Users"},
     *     summary="Delete user",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="User ID", @OA\Schema(type="integer", example=2)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="User deleted",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/UserDeleteResponse",
     *             example={"data":null,"message":"User deleted","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function usersItem(): void {}

    /**
     * @OA\Post(
     *     path="/change-password",
     *     tags={"Users"},
     *     summary="Change authenticated user password",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ChangePasswordRequest",
     *             example={"current_password":"secret123","new_password":"newsecret123","confirm_password":"newsecret123"}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Password updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ChangePasswordResponse",
     *             example={"data":true,"message":"Password updated","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ValidationErrorResponse",
     *             example={
     *                 "data": null,
     *                 "message": "Current password is incorrect",
     *                 "errors": {"current_password": {"Wrong password"}}
     *             }
     *         )
     *     )
     * )
     */
    public function changePassword(): void {}

    /**
     * @OA\Get(
     *     path="/roles",
     *     tags={"Roles"},
     *     summary="List roles",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Role list",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RolesListResponse",
     *             example={
     *                 "data": {
     *                     {"role_id": 1, "role_name": "Administrator"},
     *                     {"role_id": 2, "role_name": "Editor"}
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/roles",
     *     tags={"Roles"},
     *     summary="Create role",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleRequest",
     *             example={"role_name":"Administrator"}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Role created",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleResponse",
     *             example={
     *                 "data": {"role_id": 1, "role_name": "Administrator"},
     *                 "message": "Roles created",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ValidationErrorResponse",
     *             example={
     *                 "data": null,
     *                 "message": "The given data was invalid.",
     *                 "errors": {"role_name": {"The role name has already been taken."}}
     *             }
     *         )
     *     )
     * )
     */
    public function rolesCollection(): void {}

    /**
     * @OA\Put(
     *     path="/roles/{id}",
     *     tags={"Roles"},
     *     summary="Update role",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="Role ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleRequest",
     *             example={"role_name":"Editor"}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Role updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleResponse",
     *             example={
     *                 "data": {"role_id": 1, "role_name": "Editor"},
     *                 "message": "Role updated",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/ValidationErrorResponse",
     *             example={
     *                 "data": null,
     *                 "message": "The given data was invalid.",
     *                 "errors": {"role_name": {"The role name has already been taken."}}
     *             }
     *         )
     *     )
     * )
     *
     * @OA\Delete(
     *     path="/roles/{id}",
     *     tags={"Roles"},
     *     summary="Delete role",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="Role ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Role deleted",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleDeleteResponse",
     *             example={"data":null,"message":"Role deleted","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function rolesItem(): void {}

    /**
     * @OA\Get(
     *     path="/menus",
     *     tags={"Menus"},
     *     summary="List menus",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu list",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenusListResponse",
     *             example={
     *                 "data": {
     *                     {
     *                         "id": 1,
     *                         "menu_id": 1,
     *                         "menu_name": "Setup",
     *                         "menu_path": "/setup",
     *                         "menu_icon": "cil-settings",
     *                         "menu_parent_id": null,
     *                         "menu_order": 1
     *                     },
     *                     {
     *                         "id": 2,
     *                         "menu_id": 2,
     *                         "menu_name": "Users",
     *                         "menu_path": "/setup/users",
     *                         "menu_icon": "cil-user",
     *                         "menu_parent_id": 1,
     *                         "menu_order": 2
     *                     }
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/menus",
     *     tags={"Menus"},
     *     summary="Create menu",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuRequest",
     *             example={
     *                 "menu_name": "Dashboard",
     *                 "menu_path": "/dashboard",
     *                 "menu_icon": "cil-speedometer",
     *                 "menu_parent_id": null,
     *                 "menu_order": 1
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu created",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuResponse",
     *             example={
     *                 "data": {
     *                     "id": 3,
     *                     "menu_id": 3,
     *                     "menu_name": "Dashboard",
     *                     "menu_path": "/dashboard",
     *                     "menu_icon": "cil-speedometer",
     *                     "menu_parent_id": null,
     *                     "menu_order": 1
     *                 },
     *                 "message": "Created",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     */
    public function menusCollection(): void {}

    /**
     * @OA\Get(
     *     path="/menus-tree",
     *     tags={"Menus"},
     *     summary="List menus as tree",
     *     description="Recursive menu tree used by the dynamic sidebar and menu setup screens.",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu tree",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuTreeResponse",
     *             example={
     *                 "data": {
     *                     {
     *                         "id": 1,
     *                         "menu_id": 1,
     *                         "menu_name": "Setup",
     *                         "menu_path": "/setup",
     *                         "menu_icon": "cil-settings",
     *                         "menu_parent_id": null,
     *                         "menu_order": 1,
     *                         "children": {
     *                             {
     *                                 "id": 2,
     *                                 "menu_id": 2,
     *                                 "menu_name": "Users",
     *                                 "menu_path": "/setup/users",
     *                                 "menu_icon": "cil-user",
     *                                 "menu_parent_id": 1,
     *                                 "menu_order": 2,
     *                                 "children": {}
     *                             }
     *                         }
     *                     }
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     )
     * )
     *
     * @OA\Get(
     *     path="/menus/{id}",
     *     tags={"Menus"},
     *     summary="Get menu detail",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="Menu ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu detail",
     *
     *         @OA\JsonContent(ref="#/components/schemas/MenuResponse")
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/menus/{id}",
     *     tags={"Menus"},
     *     summary="Update menu",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="Menu ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuRequest",
     *             example={
     *                 "menu_name": "Setup",
     *                 "menu_path": "/setup",
     *                 "menu_icon": "cil-settings",
     *                 "menu_parent_id": null,
     *                 "menu_order": 1
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuResponse",
     *             example={
     *                 "data": {
     *                     "id": 1,
     *                     "menu_id": 1,
     *                     "menu_name": "Setup",
     *                     "menu_path": "/setup",
     *                     "menu_icon": "cil-settings",
     *                     "menu_parent_id": null,
     *                     "menu_order": 1
     *                 },
     *                 "message": "Updated",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Delete(
     *     path="/menus/{id}",
     *     tags={"Menus"},
     *     summary="Delete menu",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="id", in="path", required=true, description="Menu ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Menu deleted",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/MenuDeleteResponse",
     *             example={"data":true,"message":"Deleted","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function menusItem(): void {}

    /**
     * @OA\Get(
     *     path="/role-menus/{role}",
     *     tags={"Role Permissions"},
     *     summary="Get role menu permissions",
     *     description="Recursive checked menu tree used by the dynamic sidebar permission system.",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="role", in="path", required=true, description="Role ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Role menu tree",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleMenuTreeResponse",
     *             example={
     *                 "data": {
     *                     {
     *                         "id": 1,
     *                         "menu_id": 1,
     *                         "menu_name": "Setup",
     *                         "menu_path": "/setup",
     *                         "checked": true,
     *                         "children": {
     *                             {
     *                                 "id": 2,
     *                                 "menu_id": 2,
     *                                 "menu_name": "Users",
     *                                 "menu_path": "/setup/users",
     *                                 "checked": false,
     *                                 "children": {}
     *                             }
     *                         }
     *                     }
     *                 },
     *                 "message": "OK",
     *                 "errors": null
     *             }
     *         )
     *     )
     * )
     *
     * @OA\Post(
     *     path="/role-menus/{role}",
     *     tags={"Role Permissions"},
     *     summary="Update role menu permissions",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="role", in="path", required=true, description="Role ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleMenuUpdateRequest",
     *             example={"menu_ids":{1,2,3}}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Permissions updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/RoleMenuUpdateResponse",
     *             example={"data":true,"message":"Permissions updated","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function roleMenus(): void {}
}
