-- Update placeholder6 to be the Selfie with Bride & Groom game
UPDATE game_stations
SET
  name = 'Selfie with C & D',
  description = 'Take a selfie with the bride and groom',
  icon = 'Camera',
  station_id = 'selfie',
  is_active = TRUE
WHERE station_id = 'placeholder6';

-- Verify the update
SELECT * FROM game_stations WHERE station_id = 'selfie';
