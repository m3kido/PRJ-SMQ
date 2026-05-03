from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "admin")


class IsAuditeurInterne(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "auditeur_interne")


class IsAuditeurExterne(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "auditeur_externe")


class IsGestionnaire(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "gestionnaire")


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
