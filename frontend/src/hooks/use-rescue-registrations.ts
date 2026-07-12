import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRescueRegistration, deleteMyRescueRegistration, deleteRescueRegistration, getMyRescueRegistrations, getMyRescueRegistrationsPage, getRescueRegistration, getRescueRegistrations, getRescueRegistrationsPage, reviewRescueRegistration, updateMyRescueRegistration, updateRescueRegistration, type RescueRegistrationFilters, type RescueRegistrationInput } from "@/api/rescueRegistrationApi";
import type { PageParams } from "@/api/pagination";

const key = ["rescue-registrations"];
export function useRescueRegistrations(filters?: RescueRegistrationFilters) { return useQuery({ queryKey: [...key, filters], queryFn: () => getRescueRegistrations(filters) }); }
export function useMyRescueRegistrations() { return useQuery({ queryKey: [...key, "my"], queryFn: getMyRescueRegistrations }); }
export function useRescueRegistrationsPage(filters?: RescueRegistrationFilters, pagination?: PageParams) { return useQuery({ queryKey: [...key, "page", filters, pagination], queryFn: () => getRescueRegistrationsPage(filters, pagination), placeholderData: keepPreviousData }); }
export function useMyRescueRegistrationsPage(pagination?: PageParams) { return useQuery({ queryKey: [...key, "my", "page", pagination], queryFn: () => getMyRescueRegistrationsPage(pagination), placeholderData: keepPreviousData }); }
export function useRescueRegistration(id: number) { return useQuery({ queryKey: [...key, id], queryFn: () => getRescueRegistration(id), enabled: id > 0 }); }
export function useCreateRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: createRescueRegistration, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: RescueRegistrationInput }) => updateRescueRegistration(id, data), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useUpdateMyRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, rescuePointId }: { id: number; rescuePointId: number }) => updateMyRescueRegistration(id, rescuePointId), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useReviewRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, decision }: { id: number; decision: "approve" | "reject" }) => reviewRescueRegistration(id, decision), onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: deleteRescueRegistration, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
export function useDeleteMyRescueRegistration() { const client = useQueryClient(); return useMutation({ mutationFn: deleteMyRescueRegistration, onSuccess: async () => client.invalidateQueries({ queryKey: key }) }); }
