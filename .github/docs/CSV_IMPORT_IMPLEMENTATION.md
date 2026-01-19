# CSV Import Implementation Summary

## Overview
Implemented a complete CSV import feature for TrainingPeaks workouts as an interim solution while waiting for Partner API approval. This allows users to manually import their workout data from TrainingPeaks CSV exports.

## Implementation Date
January 2025

## Components Created

### 1. CSV Parser Utility (`src/lib/utils/csvParser.ts`)
**Purpose:** Parse TrainingPeaks CSV exports into Workout objects

**Key Functions:**
- `parseTrainingPeaksCSV(csvText: string): Workout[]` - Main parser function
- `generateCSVTemplate()` - Downloads example CSV template
- `parseCSVLine(line: string): string[]` - Handles quoted CSV fields
- `parseWorkoutRow(row: Record<string, string>): Workout | null` - Converts CSV row to Workout object
- `parseDuration(duration: string): number` - Handles HH:MM:SS and numeric formats
- `mapWorkoutType(type: string): TrainingType` - Maps TP workout types to app types (swim/bike/run/other)

**Supported CSV Columns:**
- Workout Date (required)
- Workout Name (required)
- Workout Type (required)
- Planned Duration
- Planned Distance
- TSS (Training Stress Score)
- Workout Description
- Avg Power / NP
- Avg HR / Max HR

**Features:**
- Handles quoted CSV fields with commas
- Parses ISO and MM/DD/YYYY date formats
- Extracts performance metrics (TSS, distance, power, HR)
- Generates unique IDs for imported workouts
- Validates required fields

### 2. CSV Import Modal (`src/components/Modals/CSVImportModal.tsx`)
**Purpose:** UI component for CSV file upload and preview

**Features:**
- File input with .csv validation
- Drag-and-drop support (future enhancement)
- Real-time parsing and preview (shows first 5 workouts)
- Template download button
- Error display with helpful messages
- Import button with loading state
- Sport-specific color coding (🏊 Swim, 🚴 Bike, 🏃 Run, 🏋️ Other)
- Performance metrics display (TSS, distance, duration)

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Close handler
- `onImport: (workouts: Workout[]) => Promise<void>` - Import handler

### 3. Sunday Prep Integration (`src/app/(app)/sunday-prep/page.tsx`)
**Added:**
- Import CSVImportModal component
- `showCSVImport` state variable
- `handleCSVImport(parsedWorkouts: Workout[])` async function
- "📥 Import CSV" button in action bar
- Modal render in JSX

**CSV Import Flow:**
1. User clicks "📥 Import CSV" button
2. Modal opens with file selector
3. User selects TrainingPeaks CSV export
4. Parser validates and converts to Workout objects
5. Preview shows first 5 workouts with metrics
6. User clicks "Import Workouts"
7. Workouts are inserted into Supabase with `profile_id` and timestamps
8. Week view refreshes to show imported workouts
9. Modal closes automatically on success

## Database Integration

### Upsert Strategy
```typescript
const dbWorkouts = parsedWorkouts.map((w) => ({
  id: w.id,
  profile_id: user.id, // Added during insert
  title: w.title,
  type: w.type,
  start: w.start,
  end: w.end,
  notes: w.notes,
  source: w.source || 'trainingpeaks',
  metadata: w.metadata || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

await supabase
  .from('workouts')
  .upsert(dbWorkouts, {
    onConflict: 'id',
    ignoreDuplicates: false
  })
```

**Note:** `profile_id` is NOT part of the Workout TypeScript interface - it's added during database insertion for Supabase RLS enforcement.

## Usage Instructions

### For Users

1. **Export from TrainingPeaks:**
   - Log into TrainingPeaks
   - Navigate to Calendar
   - Select date range (recommend 1 week at a time)
   - Export → Download as CSV

2. **Import to EnduranceBloc:**
   - Open Sunday Prep page
   - Click "📥 Import CSV" button
   - Select downloaded CSV file
   - Review preview of workouts
   - Click "Import Workouts"
   - Workouts appear in calendar grid

### CSV Template
Users can download an example template by clicking "Download Template" in the modal. Template includes:
```csv
Workout Date,Workout Name,Workout Type,Planned Duration,Planned Distance,TSS,Workout Description
2025-01-27,Easy Run,Run,3600,8,45,Recovery run with easy pace
2025-01-28,Bike Intervals,Bike,5400,30,78,4x8min @ FTP
```

## Error Handling

**Validation Errors:**
- Empty CSV file
- No valid workouts found
- Missing required columns (Date, Name, Type)
- Invalid date formats
- Invalid workout types

**Import Errors:**
- Not authenticated (redirects to login)
- Database upsert failures
- Permission errors (Supabase RLS)

All errors are displayed in the modal with clear messages.

## Future Enhancements

1. **Drag-and-Drop:** Add drag-and-drop file upload to modal
2. **Bulk Operations:** Support multiple CSV files at once
3. **Conflict Resolution:** UI for handling duplicate workouts
4. **Date Filtering:** Import only workouts within selected date range
5. **Column Mapping:** Allow users to map custom CSV column names
6. **Export:** Add ability to export workouts back to CSV

## Testing Checklist

- [x] CSV parsing with quoted fields
- [x] Date format handling (ISO, MM/DD/YYYY)
- [x] Duration parsing (HH:MM:SS, seconds)
- [x] Workout type mapping (case-insensitive)
- [x] Performance metrics extraction
- [x] Preview display with first 5 workouts
- [x] Template download functionality
- [ ] File size limits (test with large CSV)
- [ ] Edge cases (empty rows, special characters)
- [ ] Real TrainingPeaks export file (pending user test)

## Technical Decisions

### Why Not Include profile_id in Workout Interface?
The `Workout` type represents the app's domain model, while `profile_id` is a Supabase implementation detail for RLS. This separation keeps the type system clean and follows the principle that database-specific fields should be added during persistence, not in the domain model.

### Why Upsert on 'id' Instead of 'tp_workout_id'?
CSV imports don't include TrainingPeaks workout IDs (those are only available via API). Generated IDs (`csv-import-${timestamp}-${random}`) ensure uniqueness and prevent duplicates within CSV imports.

### Why Preview Limit of 5?
Balances usability (quick preview) with performance (parsing large CSVs). Users can still import all workouts - the limit only affects preview display.

## Related Documentation
- [TrainingPeaks Integration Guide](.github/docs/TRAININGPEAKS_INTEGRATION.md)
- [CSV Import Testing Guide](.github/docs/TESTING_CSV_IMPORT.md)
- [Partner API Application Guide](.github/docs/TRAININGPEAKS_PARTNER_API_APPLICATION.md)

## Maintenance Notes

**CSV Format Changes:**
If TrainingPeaks updates their CSV export format:
1. Update column names in `parseWorkoutRow()` function
2. Add new metadata fields to parser
3. Update template in `generateCSVTemplate()`
4. Test with real export file

**Performance:**
Current implementation loads entire CSV into memory. For very large exports (>1000 workouts), consider:
- Streaming CSV parser
- Batch upsert operations
- Progress indicator during import
