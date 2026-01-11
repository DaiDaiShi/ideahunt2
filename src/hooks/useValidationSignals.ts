import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import {
  getUserValidations,
  toggleValidation as toggleValidationService,
  SignalType,
} from "@/integrations/firebase/validationService";

export const useValidationSignals = (ideaId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's existing validations for this idea
  const { data: userValidations } = useQuery({
    queryKey: ["user-validations", ideaId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const validations = await getUserValidations(ideaId, user.id);
      return validations.map((v) => v.signal_type);
    },
    enabled: !!user,
  });

  const toggleValidation = useMutation({
    mutationFn: async (signalType: SignalType) => {
      if (!user) {
        throw new Error("Please sign in to vote");
      }

      await toggleValidationService(ideaId, user.id, signalType);
    },
    onSuccess: () => {
      // Invalidate related queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ["user-validations", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["featured-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["all-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["idea", ideaId] });
    },
    onError: (error: Error) => {
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
