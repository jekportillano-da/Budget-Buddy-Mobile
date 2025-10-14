# Budget Buddy Tests

This directory contains essential test files for the Budget Buddy application.

## Test Files

### `test_security.py`
- **Purpose**: Tests the SQL Prompt Injection protection system
- **Features Tested**: Prompt sanitization, input validation, security monitoring
- **Usage**: `python tests/test_security.py` (run from project root)

### `test_db_connection.py`
- **Purpose**: Tests database connectivity and schema validation
- **Features Tested**: PostgreSQL connection, table existence, schema integrity
- **Usage**: `python tests/test_db_connection.py` (run from project root)

## Running Tests

All tests should be run from the project root directory:

```bash
# Run security tests
python tests/test_security.py

# Run database tests
python tests/test_db_connection.py
```

## Test Results

Both tests should pass with all features working correctly:
- ✅ Security system functional
- ✅ Database connectivity established
- ✅ All core features operational