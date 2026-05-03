def make_blank_sheet_data(value):
    if isinstance(value, list):
        return [make_blank_sheet_data(value[0])] if value else []
    if isinstance(value, dict):
        return {key: make_blank_sheet_data(nested) for key, nested in value.items()}
    if isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return 0
    return ""
