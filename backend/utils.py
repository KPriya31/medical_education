"""Small helpers shared across the route modules."""


def status_to_label(status_):
    return "Active" if status_ else "Inactive"


def label_to_status(label):
    return 1 if label == "Active" else 0


def board_column(board):
    """Maps a 'BOME'/'BOEN' board string to its status column name."""
    if board == "BOME":
        return "bome_status"
    if board == "BOEN":
        return "boen_status"
    raise ValueError("board must be 'BOME' or 'BOEN'")
