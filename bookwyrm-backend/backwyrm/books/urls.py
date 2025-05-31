# Add this to your existing urls.py file

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, ReadingStatsView

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')

urlpatterns = [
    # ...existing urls...
    path('reading-stats/', ReadingStatsView.as_view(), name='reading-stats'),
]

urlpatterns += router.urls
