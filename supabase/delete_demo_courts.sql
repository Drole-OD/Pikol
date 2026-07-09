-- One-time cleanup: remove the original US demo courts (ids '1'..'10').
-- Cascades to their court_units and any bookings automatically.
delete from public.courts where id in ('1','2','3','4','5','6','7','8','9','10');
