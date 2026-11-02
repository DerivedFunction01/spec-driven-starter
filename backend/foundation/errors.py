"""Error types shared by every layer (foundation: leaf module)."""


class KitError(Exception):
    """Base error carrying a machine code for the API seam."""

    code = "kit-error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFound(KitError):
    code = "not-found"
