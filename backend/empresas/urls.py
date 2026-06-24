from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet, CertificadoViewSet

router = DefaultRouter()

router.register('empresas', EmpresaViewSet)
router.register('certificados', CertificadoViewSet)

urlpatterns = router.urls