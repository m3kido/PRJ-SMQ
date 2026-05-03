from rest_framework.permissions import BasePermission, SAFE_METHODS


QUALITY_ROLES = {"admin", "responsable_qualite"}


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "admin")


class IsAdminOrResponsableQualite(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role in QUALITY_ROLES)


class AdminDeleteOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method != "DELETE":
            return True
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
