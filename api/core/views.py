from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    GlobalPlanetaryCycle,
    JournalEntry,
    NatalChart,
    OnboardingSession,
    OnboardingStep,
    UserInput,
    WaitlistLead,
)
from .serializers import (
    GlobalPlanetaryCycleSerializer,
    JournalEntrySerializer,
    NatalChartSerializer,
    OnboardingSessionSerializer,
    OnboardingStepSerializer,
    OnboardingStepSubmitSerializer,
    UserInputSerializer,
    UserSerializer,
    WaitlistLeadSerializer,
)


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "cosmirror-api"})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class WaitlistCreateView(generics.CreateAPIView):
    queryset = WaitlistLead.objects.all()
    serializer_class = WaitlistLeadSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"email": ["Обязательное поле."]}, status=status.HTTP_400_BAD_REQUEST)

        existing = WaitlistLead.objects.filter(email=email).first()
        if existing:
            changed = False
            for field in ("phone", "telegram", "name", "message", "source"):
                value = request.data.get(field)
                if value and not getattr(existing, field):
                    setattr(existing, field, value)
                    changed = True
                elif value and field in ("phone", "telegram", "name", "message"):
                    setattr(existing, field, value)
                    changed = True
            if changed:
                existing.save()
            return Response(
                WaitlistLeadSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        data = {**request.data, "email": email}
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JournalEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OnboardingStepListView(generics.ListAPIView):
    """Список активных шагов онбординга (каждый со своим url_path)."""

    serializer_class = OnboardingStepSerializer
    permission_classes = [permissions.AllowAny]
    queryset = OnboardingStep.objects.filter(is_active=True)


class OnboardingSessionCreateView(APIView):
    """Создать новую сессию онбординга (до регистрации)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session = OnboardingSession.objects.create()
        if request.user.is_authenticated:
            session.user = request.user
            session.save(update_fields=["user"])
        first = OnboardingStep.objects.filter(is_active=True).order_by("order", "id").first()
        if first:
            session.current_step_slug = first.slug
            session.save(update_fields=["current_step_slug"])
        return Response(
            OnboardingSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class OnboardingSessionDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        session = get_object_or_404(OnboardingSession, token=token)
        return Response(OnboardingSessionSerializer(session).data)


class OnboardingStepSubmitView(APIView):
    """Сохранить ответ на шаг /onboarding/<slug>/ для сессии."""

    permission_classes = [permissions.AllowAny]

    def put(self, request, token, slug):
        session = get_object_or_404(OnboardingSession, token=token)
        step = get_object_or_404(OnboardingStep, slug=slug, is_active=True)
        serializer = OnboardingStepSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save_answer(session, step)
        session.refresh_from_db()
        return Response(OnboardingSessionSerializer(session).data)

    post = put


class UserInputListCreateView(generics.ListCreateAPIView):
    """Вводы внутри продукта (вопросы безопасности — позже)."""

    serializer_class = UserInputSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserInput.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, source=UserInput.Source.PRODUCT)


class NatalChartListView(generics.ListAPIView):
    """Индивидуальные карты пользователя (расчёт — позже)."""

    serializer_class = NatalChartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NatalChart.objects.filter(user=self.request.user)


class GlobalCycleListView(generics.ListAPIView):
    """Общие планетарные циклы для всех."""

    serializer_class = GlobalPlanetaryCycleSerializer
    permission_classes = [permissions.AllowAny]
    queryset = GlobalPlanetaryCycle.objects.filter(is_active=True)
