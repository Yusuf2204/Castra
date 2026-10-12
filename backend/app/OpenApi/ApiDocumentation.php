<?php

namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="Castra Financial API",
 *     version="1.0.0",
 *     description="Dokumentasi RESTful API Modul Finansial Castra (Master, Pemasukan, Pengeluaran, Laporan) & Admin CMS."
 * )
 *
 * @OA\Server(
 *     url="/api",
 *     description="Relative API Base Path"
 * )
 *
 * @OA\Tag(name="Dashboard - Analytics", description="Ringkasan finansial dan statistik operasional")
 * @OA\Tag(name="Master - Categories", description="Pengelolaan pos kategori transaksi pemasukan dan pengeluaran")
 * @OA\Tag(name="Master - Budget Groups", description="Pengelolaan alokasi amplop anggaran bulanan")
 * @OA\Tag(name="Master - Budget Periods", description="Pengelolaan siklus anggaran dinamis dan pagu kategori berbasis tanggal gajian")
 * @OA\Tag(name="Master - Income Sources", description="Pengelolaan sumber dana pemasukan per pengguna")
 * @OA\Tag(name="Pemasukan - Transactions", description="Pencatatan dan kalender arus kas masuk")
 * @OA\Tag(name="Pengeluaran - Transactions", description="Pencatatan dan kalender arus kas keluar")
 * @OA\Tag(name="Laporan - Reports", description="Laporan arus kas, realisasi anggaran, dan breakdown beban kategori")
 * @OA\Tag(name="Setup - Auth", description="Autentikasi dan token Bearer Sanctum")
 * @OA\Tag(name="Setup - Users", description="Manajemen akun pengguna")
 * @OA\Tag(name="Setup - Roles", description="Manajemen role pengguna")
 * @OA\Tag(name="Setup - Menus", description="Manajemen menu navigasi dinamis")
 * @OA\Tag(name="Setup - Role Permissions", description="Pengaturan hak akses menu per role")
 * @OA\Tag(name="Setup - Company", description="Pengaturan profil dan identitas aplikasi")
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
 *
 * @OA\Schema(
 *     schema="PaginationLinks",
 *
 *     @OA\Property(property="first", type="string", nullable=true, example="http://localhost/api/income-sources?page=1"),
 *     @OA\Property(property="last", type="string", nullable=true, example="http://localhost/api/income-sources?page=2"),
 *     @OA\Property(property="prev", type="string", nullable=true, example=null),
 *     @OA\Property(property="next", type="string", nullable=true, example="http://localhost/api/income-sources?page=2")
 * )
 *
 * @OA\Schema(
 *     schema="PaginationMeta",
 *
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="last_page", type="integer", example=2),
 *     @OA\Property(property="per_page", type="integer", example=10),
 *     @OA\Property(property="total", type="integer", example=12)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSource",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Gaji"),
 *     @OA\Property(property="description", type="string", nullable=true, example="Gaji bulanan"),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true, example="2026-09-10T10:00:00.000000Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true, example="2026-09-10T10:00:00.000000Z")
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSourceRequest",
 *     required={"name"},
 *
 *     @OA\Property(property="name", type="string", maxLength=100, example="Gaji"),
 *     @OA\Property(property="description", type="string", maxLength=1000, nullable=true, example="Gaji bulanan"),
 *     @OA\Property(property="is_active", type="boolean", example=true)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSourcesListData",
 *
 *     @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/IncomeSource")),
 *     @OA\Property(property="links", ref="#/components/schemas/PaginationLinks"),
 *     @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSourcesListResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/IncomeSourcesListData"),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSourceResponse",
 *
 *     @OA\Property(property="data", ref="#/components/schemas/IncomeSource"),
 *     @OA\Property(property="message", type="string", example="OK"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeSourceDeleteResponse",
 *
 *     @OA\Property(property="data", nullable=true, example=null),
 *     @OA\Property(property="message", type="string", example="Income source deleted"),
 *     @OA\Property(property="errors", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="BudgetGroup",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="code", type="string", example="need"),
 *     @OA\Property(property="name", type="string", example="Need (Kebutuhan Pokok)"),
 *     @OA\Property(property="percentage", type="number", format="float", example=50.0),
 *     @OA\Property(property="sort_order", type="integer", example=1),
 *     @OA\Property(property="is_system", type="boolean", example=true),
 *     @OA\Property(property="is_active", type="boolean", example=true)
 * )
 *
 * @OA\Schema(
 *     schema="BudgetGroupRequest",
 *     required={"code","name"},
 *
 *     @OA\Property(property="code", type="string", example="need"),
 *     @OA\Property(property="name", type="string", example="Need (Kebutuhan Pokok)"),
 *     @OA\Property(property="percentage", type="number", format="float", example=50.0),
 *     @OA\Property(property="sort_order", type="integer", example=1),
 *     @OA\Property(property="is_active", type="boolean", example=true)
 * )
 *
 * @OA\Schema(
 *     schema="BudgetPeriod",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Siklus Oktober 2026"),
 *     @OA\Property(property="start_date", type="string", format="date", example="2026-10-05"),
 *     @OA\Property(property="end_date", type="string", format="date", example="2026-11-04"),
 *     @OA\Property(property="income_transaction_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="total_income_allocated", type="number", format="float", example=4033247.0),
 *     @OA\Property(property="total_allocated", type="number", format="float", example=3967361.6),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Gajian tanggal 5"),
 *     @OA\Property(property="allocations", type="array", @OA\Items(ref="#/components/schemas/CategoryBudgetAllocation"))
 * )
 *
 * @OA\Schema(
 *     schema="CategoryBudgetAllocation",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="budget_period_id", type="integer", example=1),
 *     @OA\Property(property="category_id", type="integer", example=27),
 *     @OA\Property(property="category_name", type="string", example="Makan"),
 *     @OA\Property(property="category_type", type="string", example="expense"),
 *     @OA\Property(property="baseline_estimate", type="number", format="float", example=1240000.0),
 *     @OA\Property(property="allocated_amount", type="number", format="float", example=1240000.0),
 *     @OA\Property(property="notes", type="string", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="BudgetPeriodRequest",
 *     required={"name","start_date","end_date"},
 *
 *     @OA\Property(property="name", type="string", example="Siklus Oktober 2026"),
 *     @OA\Property(property="start_date", type="string", format="date", example="2026-10-05"),
 *     @OA\Property(property="end_date", type="string", format="date", example="2026-11-04"),
 *     @OA\Property(property="total_income_allocated", type="number", format="float", example=4033247.0),
 *     @OA\Property(property="income_transaction_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Gaji cair tanggal 5"),
 *     @OA\Property(property="copy_from_period_id", type="integer", nullable=true, example=null)
 * )
 *
 * @OA\Schema(
 *     schema="CategoryBudgetAllocationBatchRequest",
 *     required={"allocations"},
 *
 *     @OA\Property(
 *         property="allocations",
 *         type="array",
 *         @OA\Items(
 *             type="object",
 *             required={"category_id","allocated_amount"},
 *             @OA\Property(property="category_id", type="integer", example=27),
 *             @OA\Property(property="allocated_amount", type="number", format="float", example=1250000.0),
 *             @OA\Property(property="notes", type="string", nullable=true, example="Penyesuaian")
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="Category",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Makan & Minum"),
 *     @OA\Property(property="type", type="string", enum={"income","expense"}, example="expense"),
 *     @OA\Property(property="budget_group_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="monthly_estimate", type="number", format="float", example=2000000.0),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="budget_group", ref="#/components/schemas/BudgetGroup", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="CategoryRequest",
 *     required={"name","type"},
 *
 *     @OA\Property(property="name", type="string", example="Makan & Minum"),
 *     @OA\Property(property="type", type="string", enum={"income","expense"}, example="expense"),
 *     @OA\Property(property="budget_group_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="monthly_estimate", type="number", format="float", example=2000000.0),
 *     @OA\Property(property="is_active", type="boolean", example=true)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeTransaction",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="transaction_date", type="string", format="date", example="2026-10-01"),
 *     @OA\Property(property="amount", type="number", format="float", example=10000000.0),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Gaji pokok bulanan"),
 *     @OA\Property(property="income_source_id", type="integer", example=1),
 *     @OA\Property(property="category_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="income_source", ref="#/components/schemas/IncomeSource", nullable=true),
 *     @OA\Property(property="category", ref="#/components/schemas/Category", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="IncomeTransactionRequest",
 *     required={"income_source_id","transaction_date","amount"},
 *
 *     @OA\Property(property="income_source_id", type="integer", example=1),
 *     @OA\Property(property="category_id", type="integer", nullable=true, example=1),
 *     @OA\Property(property="transaction_date", type="string", format="date", example="2026-10-01"),
 *     @OA\Property(property="amount", type="number", format="float", example=10000000.0),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Gaji pokok bulanan")
 * )
 *
 * @OA\Schema(
 *     schema="ExpenseTransaction",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="category_id", type="integer", example=1),
 *     @OA\Property(property="transaction_date", type="string", format="date", example="2026-10-02"),
 *     @OA\Property(property="amount", type="number", format="float", example=50000.0),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Makan siang"),
 *     @OA\Property(property="category", ref="#/components/schemas/Category", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="ExpenseTransactionRequest",
 *     required={"category_id","transaction_date","amount"},
 *
 *     @OA\Property(property="category_id", type="integer", example=1),
 *     @OA\Property(property="transaction_date", type="string", format="date", example="2026-10-02"),
 *     @OA\Property(property="amount", type="number", format="float", example=50000.0),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Makan siang")
 * )
 */
class ApiDocumentation
{
    /**
     * @OA\Post(
     *     path="/login",
     *     tags={"Setup - Auth"},
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
     *     tags={"Setup - Auth"},
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
     *     tags={"Setup - Auth"},
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
     *     tags={"Setup - Company"},
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
     *     tags={"Setup - Company"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Users"},
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
     *     tags={"Setup - Roles"},
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
     *     tags={"Setup - Roles"},
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
     *     tags={"Setup - Roles"},
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
     *     tags={"Setup - Roles"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Menus"},
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
     *     tags={"Setup - Role Permissions"},
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
     *     tags={"Setup - Role Permissions"},
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

    /**
     * @OA\Get(
     *     path="/income-sources",
     *     tags={"Master - Income Sources"},
     *     summary="List income sources for the authenticated user",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="search", in="query", required=false, description="Search in name and description", @OA\Schema(type="string")),
     *     @OA\Parameter(name="is_active", in="query", required=false, description="Filter by active status", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="per_page", in="query", required=false, description="Items per page (1-100, default 15)", @OA\Schema(type="integer", example=15)),
     *     @OA\Parameter(name="page", in="query", required=false, description="Pagination page", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income source list",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourcesListResponse",
     *             example={
     *                 "data": {
     *                     "data": {
     *                         {
     *                             "id": 1,
     *                             "name": "Gaji",
     *                             "description": "Gaji bulanan",
     *                             "is_active": true,
     *                             "created_at": "2026-09-10T10:00:00.000000Z",
     *                             "updated_at": "2026-09-10T10:00:00.000000Z"
     *                         }
     *                     },
     *                     "links": {
     *                         "first": "http://localhost/api/income-sources?page=1",
     *                         "last": "http://localhost/api/income-sources?page=1",
     *                         "prev": null,
     *                         "next": null
     *                     },
     *                     "meta": {
     *                         "current_page": 1,
     *                         "last_page": 1,
     *                         "per_page": 10,
     *                         "total": 1
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
     *     path="/income-sources",
     *     tags={"Master - Income Sources"},
     *     summary="Create an income source",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceRequest",
     *             example={"name":"Gaji","description":"Gaji bulanan","is_active":true}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Income source created",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceResponse",
     *             example={
     *                 "data": {
     *                     "id": 1,
     *                     "name": "Gaji",
     *                     "description": "Gaji bulanan",
     *                     "is_active": true,
     *                     "created_at": "2026-09-10T10:00:00.000000Z",
     *                     "updated_at": "2026-09-10T10:00:00.000000Z"
     *                 },
     *                 "message": "Income source created",
     *                 "errors": null
     *             }
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function incomeSourcesCollection(): void {}

    /**
     * @OA\Get(
     *     path="/income-sources/{incomeSource}",
     *     tags={"Master - Income Sources"},
     *     summary="Show an income source",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="incomeSource", in="path", required=true, description="Income source ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income source detail",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceResponse",
     *             example={
     *                 "data": {
     *                     "id": 1,
     *                     "name": "Gaji",
     *                     "description": "Gaji bulanan",
     *                     "is_active": true,
     *                     "created_at": "2026-09-10T10:00:00.000000Z",
     *                     "updated_at": "2026-09-10T10:00:00.000000Z"
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
     *     path="/income-sources/{incomeSource}",
     *     tags={"Master - Income Sources"},
     *     summary="Update an income source",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="incomeSource", in="path", required=true, description="Income source ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceRequest",
     *             example={"name":"Gaji","description":"Gaji bulanan","is_active":true}
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income source updated",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceResponse",
     *             example={
     *                 "data": {
     *                     "id": 1,
     *                     "name": "Gaji",
     *                     "description": "Gaji bulanan",
     *                     "is_active": true,
     *                     "created_at": "2026-09-10T10:00:00.000000Z",
     *                     "updated_at": "2026-09-10T10:00:00.000000Z"
     *                 },
     *                 "message": "Income source updated",
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
     *     path="/income-sources/{incomeSource}",
     *     tags={"Master - Income Sources"},
     *     summary="Delete an income source",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="incomeSource", in="path", required=true, description="Income source ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income source deleted",
     *
     *         @OA\JsonContent(
     *             ref="#/components/schemas/IncomeSourceDeleteResponse",
     *             example={"data":null,"message":"Income source deleted","errors":null}
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function incomeSourcesItem(): void {}

    /**
     * @OA\Get(
     *     path="/categories",
     *     tags={"Master - Categories"},
     *     summary="List categories",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="type", in="query", required=false, description="Filter by type (income|expense)", @OA\Schema(type="string", enum={"income","expense"})),
     *     @OA\Parameter(name="is_active", in="query", required=false, description="Filter active status", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="budget_group_id", in="query", required=false, description="Filter by budget group ID", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, description="Search category name", @OA\Schema(type="string")),
     *     @OA\Parameter(name="all", in="query", required=false, description="Return all items without pagination", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", example=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", example=15)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of categories",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Category")),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/categories",
     *     tags={"Master - Categories"},
     *     summary="Create a category",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/CategoryRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Category created",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/Category"),
     *             @OA\Property(property="message", type="string", example="Category created"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function categoriesCollection(): void {}

    /**
     * @OA\Get(
     *     path="/categories/{category}",
     *     tags={"Master - Categories"},
     *     summary="Show a category",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="category", in="path", required=true, description="Category ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Category detail",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/Category"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/categories/{category}",
     *     tags={"Master - Categories"},
     *     summary="Update a category",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="category", in="path", required=true, description="Category ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/CategoryRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Category updated",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/Category"),
     *             @OA\Property(property="message", type="string", example="Category updated"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/categories/{category}",
     *     tags={"Master - Categories"},
     *     summary="Delete a category",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="category", in="path", required=true, description="Category ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Category deleted",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", nullable=true, example=null),
     *             @OA\Property(property="message", type="string", example="Category deleted"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Cannot delete category in use", @OA\JsonContent(ref="#/components/schemas/ApiError"))
     * )
     */
    public function categoriesItem(): void {}

    /**
     * @OA\Get(
     *     path="/budget-groups",
     *     tags={"Master - Budget Groups"},
     *     summary="List budget groups",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="is_active", in="query", required=false, description="Filter active status", @OA\Schema(type="boolean")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of budget groups",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/BudgetGroup")),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/budget-groups",
     *     tags={"Master - Budget Groups"},
     *     summary="Create a budget group",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/BudgetGroupRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Budget group created",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetGroup"),
     *             @OA\Property(property="message", type="string", example="Budget group created"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function budgetGroupsCollection(): void {}

    /**
     * @OA\Get(
     *     path="/budget-groups/{budgetGroup}",
     *     tags={"Master - Budget Groups"},
     *     summary="Show a budget group",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budgetGroup", in="path", required=true, description="Budget Group ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget group detail",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetGroup"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/budget-groups/{budgetGroup}",
     *     tags={"Master - Budget Groups"},
     *     summary="Update a budget group",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budgetGroup", in="path", required=true, description="Budget Group ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/BudgetGroupRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget group updated",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetGroup"),
     *             @OA\Property(property="message", type="string", example="Budget group updated"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/budget-groups/{budgetGroup}",
     *     tags={"Master - Budget Groups"},
     *     summary="Delete a budget group",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budgetGroup", in="path", required=true, description="Budget Group ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget group deleted",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", nullable=true, example=null),
     *             @OA\Property(property="message", type="string", example="Budget group deleted"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Cannot delete system or referenced group", @OA\JsonContent(ref="#/components/schemas/ApiError"))
     * )
     */
    public function budgetGroupsItem(): void {}

    /**
     * @OA\Get(
     *     path="/budget-periods",
     *     tags={"Master - Budget Periods"},
     *     summary="List budget periods",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="is_active", in="query", required=false, description="Filter by active status (1 or 0)", @OA\Schema(type="integer", enum={0,1}, example=1)),
     *     @OA\Parameter(name="search", in="query", required=false, description="Search by period name", @OA\Schema(type="string", example="Oktober")),
     *     @OA\Parameter(name="page", in="query", required=false, description="Page number", @OA\Schema(type="integer", example=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, description="Items per page", @OA\Schema(type="integer", example=15)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of budget periods",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/BudgetPeriod")),
     *             @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/budget-periods",
     *     tags={"Master - Budget Periods"},
     *     summary="Create a new budget period",
     *     description="Creates a period and automatically generates allocations for active expense categories.",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/BudgetPeriodRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Budget period created",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetPeriod"),
     *             @OA\Property(property="message", type="string", example="Periode anggaran berhasil dibuat"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function budgetPeriodsCollection(): void {}

    /**
     * @OA\Get(
     *     path="/budget-periods/{budget_period}",
     *     tags={"Master - Budget Periods"},
     *     summary="Get budget period detail",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budget_period", in="path", required=true, description="Budget Period ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget period detail",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetPeriod"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/budget-periods/{budget_period}",
     *     tags={"Master - Budget Periods"},
     *     summary="Update budget period",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budget_period", in="path", required=true, description="Budget Period ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/BudgetPeriodRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget period updated",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetPeriod"),
     *             @OA\Property(property="message", type="string", example="Periode anggaran berhasil diperbarui"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/budget-periods/{budget_period}",
     *     tags={"Master - Budget Periods"},
     *     summary="Delete a budget period",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budget_period", in="path", required=true, description="Budget Period ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget period deleted",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", nullable=true, example=null),
     *             @OA\Property(property="message", type="string", example="Periode anggaran berhasil dihapus"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Get(
     *     path="/budget-periods/{budget_period}/allocations",
     *     tags={"Master - Budget Periods"},
     *     summary="Get category allocations for a period",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budget_period", in="path", required=true, description="Budget Period ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="List of category allocations",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/CategoryBudgetAllocation")),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/budget-periods/{budget_period}/allocations",
     *     tags={"Master - Budget Periods"},
     *     summary="Batch update category allocations for a period",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="budget_period", in="path", required=true, description="Budget Period ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/CategoryBudgetAllocationBatchRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Allocations updated",
     *
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/BudgetPeriod"),
     *             @OA\Property(property="message", type="string", example="Alokasi anggaran kategori berhasil disimpan"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function budgetPeriodsItem(): void {}

    /**
     * @OA\Get(
     *     path="/incomes",
     *     tags={"Pemasukan - Transactions"},
     *     summary="List income transactions",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=false, description="Filter month (YYYY-MM)", @OA\Schema(type="string", example="2026-10")),
     *     @OA\Parameter(name="start_date", in="query", required=false, description="Filter start date (YYYY-MM-DD)", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", required=false, description="Filter end date (YYYY-MM-DD)", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="income_source_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="category_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", example=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", example=15)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of incomes",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/IncomeTransaction")),
     *                 @OA\Property(property="links", ref="#/components/schemas/PaginationLinks"),
     *                 @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/incomes",
     *     tags={"Pemasukan - Transactions"},
     *     summary="Record income transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/IncomeTransactionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Income created",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/IncomeTransaction"),
     *             @OA\Property(property="message", type="string", example="Transaksi pemasukan berhasil dicatat"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function incomesCollection(): void {}

    /**
     * @OA\Get(
     *     path="/incomes/calendar",
     *     tags={"Pemasukan - Transactions"},
     *     summary="Get monthly income calendar aggregate",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=true, description="Month in YYYY-MM format", @OA\Schema(type="string", example="2026-10")),
     *     @OA\Parameter(name="income_source_id", in="query", required=false, @OA\Schema(type="integer")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Monthly income calendar breakdown",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="month", type="string", example="2026-10"),
     *                 @OA\Property(property="total_month", type="number", format="float", example=10000000.0),
     *                 @OA\Property(property="transaction_count", type="integer", example=2),
     *                 @OA\Property(property="days", type="object")
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function incomesCalendar(): void {}

    /**
     * @OA\Get(
     *     path="/incomes/{income}",
     *     tags={"Pemasukan - Transactions"},
     *     summary="Show income transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="income", in="path", required=true, description="Income transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income transaction detail",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/IncomeTransaction"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/incomes/{income}",
     *     tags={"Pemasukan - Transactions"},
     *     summary="Update income transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="income", in="path", required=true, description="Income transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/IncomeTransactionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income transaction updated",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/IncomeTransaction"),
     *             @OA\Property(property="message", type="string", example="Transaksi pemasukan berhasil diperbarui"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/incomes/{income}",
     *     tags={"Pemasukan - Transactions"},
     *     summary="Delete income transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="income", in="path", required=true, description="Income transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Income transaction deleted",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", nullable=true, example=null),
     *             @OA\Property(property="message", type="string", example="Transaksi pemasukan berhasil dihapus"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function incomesItem(): void {}

    /**
     * @OA\Get(
     *     path="/expenses",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="List expense transactions",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=false, description="Filter month (YYYY-MM)", @OA\Schema(type="string", example="2026-10")),
     *     @OA\Parameter(name="start_date", in="query", required=false, description="Filter start date (YYYY-MM-DD)", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", required=false, description="Filter end date (YYYY-MM-DD)", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="category_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="budget_group_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", example=1)),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", example=15)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of expenses",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/ExpenseTransaction")),
     *                 @OA\Property(property="links", ref="#/components/schemas/PaginationLinks"),
     *                 @OA\Property(property="meta", ref="#/components/schemas/PaginationMeta")
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Post(
     *     path="/expenses",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="Record expense transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/ExpenseTransactionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Expense created",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/ExpenseTransaction"),
     *             @OA\Property(property="message", type="string", example="Transaksi pengeluaran berhasil dicatat"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     */
    public function expensesCollection(): void {}

    /**
     * @OA\Get(
     *     path="/expenses/calendar",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="Get monthly expense calendar aggregate",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=true, description="Month in YYYY-MM format", @OA\Schema(type="string", example="2026-10")),
     *     @OA\Parameter(name="category_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="budget_group_id", in="query", required=false, @OA\Schema(type="integer")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Monthly expense calendar breakdown",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="month", type="string", example="2026-10"),
     *                 @OA\Property(property="total_month", type="number", format="float", example=5500000.0),
     *                 @OA\Property(property="transaction_count", type="integer", example=5),
     *                 @OA\Property(property="days", type="object")
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function expensesCalendar(): void {}

    /**
     * @OA\Get(
     *     path="/expenses/{expense}",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="Show expense transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="expense", in="path", required=true, description="Expense transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Expense transaction detail",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/ExpenseTransaction"),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     *
     * @OA\Put(
     *     path="/expenses/{expense}",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="Update expense transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="expense", in="path", required=true, description="Expense transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(ref="#/components/schemas/ExpenseTransactionRequest")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Expense transaction updated",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", ref="#/components/schemas/ExpenseTransaction"),
     *             @OA\Property(property="message", type="string", example="Transaksi pengeluaran berhasil diperbarui"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ValidationErrorResponse"))
     * )
     *
     * @OA\Delete(
     *     path="/expenses/{expense}",
     *     tags={"Pengeluaran - Transactions"},
     *     summary="Delete expense transaction",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="expense", in="path", required=true, description="Expense transaction ID", @OA\Schema(type="integer", example=1)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Expense transaction deleted",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="data", nullable=true, example=null),
     *             @OA\Property(property="message", type="string", example="Transaksi pengeluaran berhasil dihapus"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function expensesItem(): void {}

    /**
     * @OA\Get(
     *     path="/reports/cash-flow",
     *     tags={"Laporan - Reports"},
     *     summary="Get annual cash flow report",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="year", in="query", required=false, description="Year (default: current year)", @OA\Schema(type="integer", example=2026)),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Annual cash flow report with monthly figures",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="year", type="integer", example=2026),
     *                 @OA\Property(property="total_income_year", type="number", format="float", example=120000000.0),
     *                 @OA\Property(property="total_expense_year", type="number", format="float", example=70000000.0),
     *                 @OA\Property(property="net_savings_year", type="number", format="float", example=50000000.0),
     *                 @OA\Property(property="savings_rate_percent", type="number", format="float", example=41.67),
     *                 @OA\Property(property="months", type="array", @OA\Items(type="object"))
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Get(
     *     path="/reports/budget-comparison",
     *     tags={"Laporan - Reports"},
     *     summary="Get monthly 50/30/20 budget envelope comparison",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=false, description="Month in YYYY-MM format", @OA\Schema(type="string", example="2026-10")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Budget allocation vs actual spending",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="month", type="string", example="2026-10"),
     *                 @OA\Property(property="total_income", type="number", format="float", example=10000000.0),
     *                 @OA\Property(property="total_expense", type="number", format="float", example=5500000.0),
     *                 @OA\Property(property="unallocated_amount", type="number", format="float", example=0.0),
     *                 @OA\Property(property="budget_groups", type="array", @OA\Items(type="object"))
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     *
     * @OA\Get(
     *     path="/reports/category-breakdown",
     *     tags={"Laporan - Reports"},
     *     summary="Get monthly expense breakdown by category",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Parameter(name="month", in="query", required=false, description="Month in YYYY-MM format", @OA\Schema(type="string", example="2026-10")),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Category breakdown percentage and estimates",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="month", type="string", example="2026-10"),
     *                 @OA\Property(property="total_expense", type="number", format="float", example=5500000.0),
     *                 @OA\Property(property="category_count", type="integer", example=4),
     *                 @OA\Property(property="categories", type="array", @OA\Items(type="object"))
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     */
    public function reportsEndpoints(): void {}

    /**
     * @OA\Get(
     *     path="/dashboard-summary",
     *     tags={"Dashboard - Analytics"},
     *     summary="Get system & financial analytics summary",
     *     security={{"bearerAuth":{}}},
     *
     *     @OA\Response(
     *         response=200,
     *         description="Combined system stats and current month financial health metrics",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(
     *                     property="system",
     *                     type="object",
     *                     @OA\Property(property="total_users", type="integer", example=1),
     *                     @OA\Property(property="total_roles", type="integer", example=1),
     *                     @OA\Property(property="total_menus", type="integer", example=15),
     *                     @OA\Property(property="active_role", type="string", example="Super Admin")
     *                 ),
     *                 @OA\Property(
     *                     property="finance",
     *                     type="object",
     *                     @OA\Property(property="current_month", type="string", example="2026-10"),
     *                     @OA\Property(property="total_income_this_month", type="number", format="float", example=10000000.0),
     *                     @OA\Property(property="total_expense_this_month", type="number", format="float", example=5500000.0),
     *                     @OA\Property(property="net_savings_this_month", type="number", format="float", example=4500000.0),
     *                     @OA\Property(property="budget_utilization_percent", type="number", format="float", example=55.0),
     *                     @OA\Property(property="budget_groups_summary", type="array", @OA\Items(type="object")),
     *                     @OA\Property(property="recent_transactions", type="array", @OA\Items(type="object"))
     *                 )
     *             ),
     *             @OA\Property(property="message", type="string", example="OK"),
     *             @OA\Property(property="errors", nullable=true, example=null)
     *         )
     *     ),
     *
     *     @OA\Response(response=401, description="Unauthorized")
     * )
     */
    public function dashboardSummary(): void {}
}
