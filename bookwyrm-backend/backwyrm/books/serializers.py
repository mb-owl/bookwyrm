from rest_framework import serializers
from .models import Book, BookPhoto, Genre

class GenreSerializer(serializers.ModelSerializer):
    """Serializer for the Genre model"""
    class Meta:
        model = Genre
        fields = ['code', 'name']

class BookPhotoSerializer(serializers.ModelSerializer):
    """Serializer for book photos"""
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BookPhoto
        fields = ['id', 'photo', 'photo_url', 'uploaded_at']
    
    def get_photo_url(self, obj):
        """Get the full URL for the photo"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

class BookSerializer(serializers.ModelSerializer):
    """Serializer for books"""
    photos = BookPhotoSerializer(many=True, read_only=True)
    genre_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = '__all__'
    
    def get_genre_name(self, obj):
        """Get the display name of the primary genre"""
        try:
            genre_obj = Genre.objects.get(code=obj.genre)
            return genre_obj.name
        except Genre.DoesNotExist:
            return None