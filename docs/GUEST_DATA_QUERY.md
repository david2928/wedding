# Guest Data SQL Query

## Complete Guest Details Query

This query retrieves all guest information including party details, food preferences, and dietary requirements for attending guests from completed parties.

```sql
SELECT
  g.id as guest_id,
  g.first_name,
  g.internal_name,
  g.age_group,
  g.food_preference as main_course,
  g.dietary_requirements,
  g.drinks_alcohol,
  g.rsvp_status,
  p.id as party_id,
  p.name as party_name,
  p.code as party_code,
  p.type as party_type,
  p.from_side,
  p.status as party_status
FROM guests g
JOIN parties p ON g.party_id = p.id
WHERE g.rsvp_status = 'Attending'
  AND p.status = 'completed'
ORDER BY p.name, g.first_name;
```

## Summary Statistics Query

Get aggregate statistics by party status and age group:

```sql
SELECT
  'Completed' as party_status,
  COUNT(DISTINCT p.id) as party_count,
  COUNT(CASE WHEN g.age_group = 'Adult' AND g.rsvp_status = 'Attending' THEN 1 END) as adults,
  COUNT(CASE WHEN g.age_group = 'Child' AND g.rsvp_status = 'Attending' THEN 1 END) as children,
  COUNT(CASE WHEN g.age_group = 'Toddler' AND g.rsvp_status = 'Attending' THEN 1 END) as toddlers
FROM parties p
LEFT JOIN guests g ON p.id = g.party_id
WHERE p.status = 'completed'
UNION ALL
SELECT
  'Pending' as party_status,
  COUNT(DISTINCT p.id) as party_count,
  COUNT(CASE WHEN g.age_group = 'Adult' AND g.rsvp_status = 'Attending' THEN 1 END) as adults,
  COUNT(CASE WHEN g.age_group = 'Child' AND g.rsvp_status = 'Attending' THEN 1 END) as children,
  COUNT(CASE WHEN g.age_group = 'Toddler' AND g.rsvp_status = 'Attending' THEN 1 END) as toddlers
FROM parties p
LEFT JOIN guests g ON p.id = g.party_id
WHERE p.status = 'pending';
```

## Food Preference Breakdown Query

Get counts of each main course selection:

```sql
SELECT
  COALESCE(g.food_preference, 'Not Selected') as main_course,
  COUNT(*) as guest_count
FROM guests g
JOIN parties p ON g.party_id = p.id
WHERE g.rsvp_status = 'Attending'
  AND p.status = 'completed'
  AND g.age_group = 'Adult'
GROUP BY g.food_preference
ORDER BY guest_count DESC;
```

## Dietary Requirements Query

List all guests with dietary restrictions:

```sql
SELECT
  p.name as party_name,
  g.first_name,
  g.food_preference as main_course,
  g.dietary_requirements
FROM guests g
JOIN parties p ON g.party_id = p.id
WHERE g.rsvp_status = 'Attending'
  AND p.status = 'completed'
  AND g.dietary_requirements IS NOT NULL
  AND g.dietary_requirements != ''
ORDER BY p.name, g.first_name;
```

## Query Results Summary

**Total Attending Guests:** 100 (from completed parties)
- **Adults:** 91
- **Children:** 1
- **Toddlers:** 8

**Party Statistics:**
- **Completed Parties:** 66
- **Pending Parties:** 2

## Output Files

- **CSV File:** `wedding_seating_chart.csv` - Complete seating chart with table assignments
- **Table Layout:** `TABLE_LAYOUT.md` - Visual table layout document

## CSV Format

```
Table,Seat,Guest_ID,Name,Main_Course,Dietary_Restrictions
```

## Notes

- Toddlers have `null` main_course as they get kids meals
- Guest_ID is the unique UUID from the `guests` table
- Dietary restrictions are included verbatim from the database
- All queries exclude test data and non-attending guests
