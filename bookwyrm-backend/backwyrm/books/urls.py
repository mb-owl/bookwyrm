# Add this to your existing urls.py file

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GenreViewSet

router = DefaultRouter()
# ...existing router registrations...
router.register(r'genres', GenreViewSet)

urlpatterns = [
    # ...existing url patterns...
    path('', include(router.urls)),
]
