<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ShopInteractionController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/home', [CatalogController::class, 'home']);
Route::get('/products', [CatalogController::class, 'products']);
Route::get('/products/{key}', [CatalogController::class, 'product']);
Route::get('/categories', [CatalogController::class, 'categories']);
Route::get('/brands', [CatalogController::class, 'brands']);
Route::get('/search/suggest', [CatalogController::class, 'searchSuggest']);
Route::get('/products-id/{id}/reviews', [ShopInteractionController::class, 'index']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'store']);
Route::put('/cart/items/{id}', [CartController::class, 'update']);
Route::delete('/cart/items/{id}', [CartController::class, 'destroy']);
Route::post('/coupons/validate', [OrderController::class, 'validateCoupon']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);

    Route::get('/addresses', [\App\Http\Controllers\Api\AddressController::class, 'index']);
    Route::post('/addresses', [\App\Http\Controllers\Api\AddressController::class, 'store']);
    Route::put('/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'destroy']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);

    Route::post('/products-id/{id}/reviews', [ShopInteractionController::class, 'store']);

    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'read']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [\App\Http\Controllers\Api\AdminController::class, 'stats']);
    Route::get('/orders', [\App\Http\Controllers\Api\AdminController::class, 'orders']);
    Route::get('/orders/{id}', [\App\Http\Controllers\Api\AdminController::class, 'orderDetail']);
    Route::patch('/orders/{id}/status', [\App\Http\Controllers\Api\AdminController::class, 'updateOrderStatus']);
    Route::get('/customers', [\App\Http\Controllers\Api\AdminController::class, 'customers']);

    Route::post('/admin-products/{id}/mark-sold', [\App\Http\Controllers\Api\AdminProductController::class, 'markSold']);
    Route::apiResource('admin-products', \App\Http\Controllers\Api\AdminProductController::class)
        ->parameters(['admin-products' => 'id']);
    Route::apiResource('admin-categories', \App\Http\Controllers\Api\AdminCategoryController::class)
        ->parameters(['admin-categories' => 'id']);
    Route::apiResource('coupons', \App\Http\Controllers\Api\AdminCouponController::class)
        ->parameters(['coupons' => 'id']);
    Route::get('/reviews', [\App\Http\Controllers\Api\AdminController::class, 'reviews']);
    Route::patch('/reviews/{id}', [\App\Http\Controllers\Api\AdminController::class, 'moderateReview']);
});
