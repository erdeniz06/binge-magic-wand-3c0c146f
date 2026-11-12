import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { guessCountry } from "@/lib/countries";

/**
 * The signed-in user's country (ISO code). Falls back to the browser
 * locale region, then "US". Used for watch-provider regions and local
 * show recommendations.
 */
export function useUserCountry() {
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["profile", "country"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("country")
        .eq("id", userData.user.id)
        .maybeSingle();
      return data?.country ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });

  const country = q.data ?? guessCountry();

  const setCountry = async (code: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase
      .from("profiles")
      .update({ country: code })
      .eq("id", userData.user.id);
    queryClient.setQueryData(["profile", "country"], code);
  };

  return { country, isSet: q.data != null, isLoading: q.isLoading, setCountry };
}
