import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

type SignalType = "want_to_use" | "willing_to_pay" | "waitlist";

export const useValidationSignals = (ideaId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's existing validations for this idea
  const { data: userValidations } = useQuery({
    queryKey: ["user-validations", ideaId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("idea_validations")
        .select("signal_type")
        .eq("idea_id", ideaId)
        .eq("user_id", user.id);

      if (error) throw error;
      return data?.map((v) => v.signal_type) || [];
    },
    enabled: !!user,
  });

  const toggleValidation = useMutation({
    mutationFn: async (signalType: SignalType) => {
      if (!user) {
        throw new Error("Please sign in to vote");
      }

      const hasVoted = userValidations?.includes(signalType);

      if (hasVoted) {
        // Remove the vote
        const { error } = await supabase
          .from("idea_validations")
          .delete()
          .eq("idea_id", ideaId)
          .eq("user_id", user.id)
          .eq("signal_type", signalType);

        if (error) throw error;
      } else {
        // Add the vote
        const { error } = await supabase
          .from("idea_validations")
          .insert({
            idea_id: ideaId,
            user_id: user.id,
            signal_type: signalType,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate related queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ["user-validations", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["featured-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const hasVoted = (signalType: SignalType) => {
    return userValidations?.includes(signalType) || false;
  };

  return {
    hasVoted,
    toggleValidation: toggleValidation.mutate,
    isPending: toggleValidation.isPending,
    isAuthenticated: !!user,
  };
};
