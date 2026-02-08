# CSV Import (TrainingPeaks)

CSV import is a temporary alternative while Partner API access is pending. It parses TrainingPeaks exports and upserts into `workouts`.

## Key Files

- `src/lib/utils/csvParser.ts`
- `src/components/Modals/CSVImportModal.tsx`
- `src/app/(app)/sunday-prep/page.tsx`

## Flow

1) User uploads CSV in the Sunday Prep modal.
2) CSV is parsed into `Workout` objects.
3) Workouts are upserted into Supabase with `profile_id`.

## Notes

- Required columns: date, name, type.
- Metrics like TSS, distance, power, and HR are stored in `metadata` when present.
- IDs are generated for CSV imports since TP IDs are not available in CSV.
