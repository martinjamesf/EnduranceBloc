# TrainingPeaks Integration

TrainingPeaks syncs next-week workouts into the Sunday Prep flow.

## Required Env

```env
TRAININGPEAKS_CLIENT_ID=
TRAININGPEAKS_CLIENT_SECRET=
TRAININGPEAKS_REDIRECT_URI=http://localhost:3000/api/trainingpeaks/callback
```

## Endpoints

- `GET /api/trainingpeaks/connect`
- `GET /api/trainingpeaks/callback`
- `POST /api/trainingpeaks/sync`

## Key Files

- `src/lib/integrations/trainingpeaks.ts`
- `src/lib/services/syncService.ts`
- `src/lib/hooks/useTrainingPeaksSync.ts`
- `src/app/api/trainingpeaks/sync/route.ts`

## Notes

- Tokens are stored server-side and refreshed when needed.
- Sync calculates Monday-Sunday for the next week.
- Performance metrics (TSS, distance, power, HR) are stored in `metadata` when available.
metadata?: {
  tss?: number              // Training Stress Score (0-500+)
  distance?: number         // km
  avgWatts?: number         // avg power in watts
  maxWatts?: number         // max power in watts
  avgHr?: number            // avg heart rate bpm
  maxHr?: number            // max heart rate bpm
}
```

This data is displayed in:
1. **Workouts Panel** - Grid view with cards
2. **Future**: Detailed workout pages
3. **Future**: Analytics/trends dashboard

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "No TrainingPeaks connection found" | User not connected | Go to Settings → Connect TrainingPeaks |
| "Failed to refresh TrainingPeaks token" | Token expired and refresh failed | Reconnect your account in Settings |
| "Not authenticated" | Missing Supabase session | Log in to EnduranceBloc |
| Zero workouts synced | No scheduled workouts for next week | Add workouts to your TrainingPeaks calendar |

## Token Management

- **Access Token Expiry**: Default 3600 seconds (1 hour)
- **Refresh Strategy**: Automatic when sync is triggered and token is expired
- **Storage**: Encrypted in Supabase user metadata
- **Security**: Never exposed to frontend; only used server-side

## Roadmap

### Current MVP
- ✅ Next week sync (Mon-Sun)
- ✅ Performance data display
- ✅ Manual sync button
- ✅ Database upsert

### Phase 2 (Bonus)
- 🎯 Automatic daily sync at 8am
- 🎯 Sync on Sunday Prep open
- 🎯 Edit/reschedule workouts in Sunday Prep
- 🎯 Bidirectional sync (update TP from EnduranceBloc)

### Phase 3 (Future)
- 🎯 Workout detail page with full metrics
- 🎯 Performance trends chart
- 🎯 AI suggestions based on power/HR data
- 🎯 Intensity distribution (Sweet Spot, Threshold, Z5)
- 🎯 Calendar heatmap by TSS

## Testing

### Manual Testing Checklist

- [ ] Can connect TrainingPeaks account
- [ ] Tokens stored in Supabase users table
- [ ] Sync button appears in Sunday Prep
- [ ] Click sync shows loading state
- [ ] Workouts appear in panel after sync
- [ ] Metrics display for workouts with power/HR data
- [ ] Multiple syncs don't duplicate workouts
- [ ] Token refresh works (modify expires_at in DB to past time)
- [ ] Error messages display for auth failures
- [ ] Works on both desktop and mobile

### API Testing

```bash
# Test sync endpoint (requires auth)
curl -X POST http://localhost:3000/api/trainingpeaks/sync \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json"
```

## FAQ

**Q: How often should I sync?**
A: Currently manual. Recommended: once per week on Sunday. Future: automatic daily.

**Q: Can I edit TP workouts in EnduranceBloc?**
A: Not yet. Currently read-only. Bidirectional sync is on the roadmap.

**Q: What data is collected?**
A: Only your workout data (name, time, metrics). No personal data beyond what you authorize.

**Q: Does syncing affect my TP account?**
A: No, it's read-only. EnduranceBloc only retrieves your workouts.

**Q: Can I see past weeks?**
A: Currently only next week. You can navigate weeks in Sunday Prep (← Previous button) but those won't have TP data.

## Troubleshooting

### No Workouts After Sync

1. Check TrainingPeaks has workouts scheduled for next week
2. Verify token is valid: check `trainingpeaks_token_expires_at` in Supabase
3. Check browser console for errors
4. Try refreshing the page

### "Token Expired" Error Repeatedly

1. Disconnect TrainingPeaks in Settings
2. Reconnect and re-authorize
3. Try sync again

### Performance Metrics Not Showing

1. Metrics only available for completed workouts in TrainingPeaks
2. Scheduled-only workouts won't have power/HR data
3. Check TrainingPeaks has metrics recorded for that workout

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console for error details
3. Contact the EnduranceBloc team
4. Check TrainingPeaks API documentation: https://github.com/TrainingPeaks/tp-public-api-auth
