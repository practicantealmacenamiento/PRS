from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  # type: ignore

token_obtain_view = csrf_exempt(TokenObtainPairView.as_view())
token_refresh_view = csrf_exempt(TokenRefreshView.as_view())

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("app.interfaces.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    # Auth
    path("api/token/", token_obtain_view, name="token_obtain_pair"),
    path("api/token/refresh/", token_refresh_view, name="token_refresh"),
]
