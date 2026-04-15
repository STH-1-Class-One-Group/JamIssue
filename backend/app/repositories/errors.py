class RepositoryError(ValueError):
    """Base repository contract error."""


class RepositoryNotFoundError(RepositoryError):
    """Raised when a requested entity is not present."""


class RepositoryValidationError(RepositoryError):
    """Raised when repository input or identifier validation fails."""
