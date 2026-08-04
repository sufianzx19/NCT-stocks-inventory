import repository as repo

units = repo.get_units_by_project_like('%GRAND ION DELEMEN%')

# Updated subsale list with corrected database formats
full_subsale = {
    'E2-22-05','E3-11-01','E3-12-01','E3-18-03','E7-36-01','E7-36-03','E2-13A-09',
    'E3-8-01','E3-8-02','E3-8-03','E3-9-01','E3-9-02','E3-9-03','E4-22-10',
    'E1-23A-03','E1-23A-03A','E2-10-09','E2-22-01','E3-10-03','E3-1-01','E3-1-02',
    'E3-1-03','E3-1-05','E3-1-06','E3-11-02','E3-11-03','E3-11-06','E3-12-02',
    'E3-12-03','E3-13A-01','E3-13A-02','E3-13A-03','E3-15-01','E3-15-03','E3-16-01',
    'E3-16-02','E3-17-01','E3-18-01','E3-19-01','E3-19-03A','E3-20-03','E3-20-06',
    'E3-2-01','E3-2-03','E3-2-03A','E3-2-05','E3-21-01','E3-21-03','E3-22-01',
    'E3-22-03A','E3-23-01','E3-23-03','E3-23A-01','E3-23A-03','E3-23A-03A','E3-3-03',
    'E3-3-03A','E3-3-05','E3-03A-01','E3-03A-02','E3-03A-03','E3-03A-05','E3-5-01',
    'E3-5-02','E3-5-03','E3-5-05','E3-6-02','E3-6-03A','E3-7-01','E3-7-02','E3-7-03',
    'E3-7-03A','E3-7-05','E3-8-03A','E4-6-01','E4-7-01','E4-7-10','E4-9-10','E4-10-01',
    'E4-11-01','E4-12-01','E4-13-01','E4-13A-01','E4-13A-10','E4-15-01','E4-17-01',
    'E4-19-01','E4-21-01','E4-21-10','E4-23-01','E4-23A-01','E4-23A-02'
}

subsale_in_db = set()
for u in units:
    unit_no = (u.get('unit_no') or '').strip().upper()
    if unit_no in full_subsale:
        subsale_in_db.add(unit_no)

missing = sorted(full_subsale - subsale_in_db)
available = [u for u in units if (u.get('status') or '').strip().lower() == 'available']
available_nos = set((u.get('unit_no') or '').strip().upper() for u in available)

print('=== GRAND ION DELEMEN - SUBSALE UNIT DISCREPANCY REPORT ===')
print(f'1. Total GID units in database: {len(units)}')
print(f'2. Total units in 92-unit Subsale list: {len(full_subsale)}')
print(f'3. Subsale units FOUND in database: {len(subsale_in_db)}')
print(f'4. Subsale units NOT in database: {len(missing)}')
if missing:
    print(f'   Missing: {", ".join(missing)}')
print(f'5. Current Available units (Status=Available): {len(available_nos)}')
print(f'   {available_nos}')
overlap = available_nos & subsale_in_db
print(f'6. Available units already in subsale list: {len(overlap)}')
if overlap:
    print(f'   Overlapping units: {", ".join(sorted(overlap))}')
unique_available = len(subsale_in_db) + len(available_nos - subsale_in_db)
print(f'7. Expected total display-available: {unique_available}')
print(f'   = {len(subsale_in_db)} subsale + {len(available_nos - subsale_in_db)} available not in subsale')
print()
if len(subsale_in_db) == 92 and unique_available == 100:
    print('✓ SUCCESS: All 92 subsale units found, total 100 display-available units')
else:
    print('✗ ISSUE: Expected 92 subsale and 100 total')