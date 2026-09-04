"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const tournamentSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100),
  description: z.string().optional(),
  game: z.string().min(1, "Le jeu est requis"),
  mode: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"]),
  playersPerTeam: z.number().int().min(1).max(20),
  maxTeams: z.number().int().min(2).max(256),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  registrationDeadline: z.string().min(1, "La date limite d'inscription est requise"),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ONGOING", "FINISHED"]),
  image: z.string().url().optional().or(z.literal("")),
})

type TournamentFormValues = z.infer<typeof tournamentSchema>

interface TournamentFormProps {
  mode: "create" | "edit"
  initialData?: Partial<TournamentFormValues> & { id?: string }
}

const modeLabels: Record<string, string> = {
  SINGLE_ELIMINATION: "Élimination simple",
  DOUBLE_ELIMINATION: "Double élimination",
  ROUND_ROBIN: "Poules",
  SWISS: "Système suisse",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert aux inscriptions",
  CLOSED: "Inscriptions fermées",
  ONGOING: "En cours",
  FINISHED: "Terminé",
}

function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toISOString().slice(0, 16)
}

export function TournamentForm({ mode, initialData }: TournamentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      game: initialData?.game || "",
      mode: initialData?.mode || "SINGLE_ELIMINATION",
      playersPerTeam: initialData?.playersPerTeam || 5,
      maxTeams: initialData?.maxTeams || 16,
      startDate: formatDateForInput(initialData?.startDate),
      endDate: formatDateForInput(initialData?.endDate),
      registrationDeadline: formatDateForInput(initialData?.registrationDeadline),
      status: initialData?.status || "DRAFT",
      image: initialData?.image || "",
    },
  })

  async function onSubmit(data: TournamentFormValues) {
    setIsSubmitting(true)
    try {
      const url =
        mode === "create"
          ? "/api/admin/tournaments"
          : `/api/admin/tournaments/${initialData?.id}`
      const method = mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      toast.success(
        mode === "create" ? "Tournoi créé avec succès" : "Tournoi mis à jour"
      )
      router.push("/admin/tournaments")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du tournoi *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Championnat Spring 2025"
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Décrivez le tournoi, les règles, les prix..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="game"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jeu *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: League of Legends, Valorant..."
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image de couverture (URL)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://..."
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormDescription>
                    URL d&apos;une image pour illustrer le tournoi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Sélectionner un format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(modeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="playersPerTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joueurs par équipe *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="min-h-[44px]"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      1 = solo, 5 = équipe de 5
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre max d&apos;équipes *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={256}
                        className="min-h-[44px]"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 2)}
                      />
                    </FormControl>
                    <FormDescription>
                      Entre 2 et 256 équipes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="registrationDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date limite d&apos;inscription *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="datetime-local"
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="min-h-[44px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="min-h-[44px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="min-h-[44px]"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "create" ? "Créer le tournoi" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
