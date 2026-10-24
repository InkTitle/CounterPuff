import { getCurrentUser, jsonOk } from "@/lib/auth";
import { loadProfileBundle } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, user: null }, { status: 401 });
  const bundle = await loadProfileBundle(user.id);
  return jsonOk({
    user,
    profile: bundle.profile,
    onboardingComplete: bundle.profile?.onboardingComplete ?? false,
  });
}
