"""
Migration utilities for MongoDB to PostgreSQL data migration
"""
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class MigrationStats:
    """Track migration statistics"""

    def __init__(self):
        self.total_records = 0
        self.successful_migrations = 0
        self.failed_migrations = 0
        self.skipped_records = 0
        self.errors = []
        self.start_time = None
        self.end_time = None

    def start(self):
        """Start migration timer"""
        self.start_time = datetime.utcnow()
        logger.info("=" * 80)
        logger.info("MIGRATION STARTED")
        logger.info("=" * 80)

    def end(self):
        """End migration timer"""
        self.end_time = datetime.utcnow()
        duration = (self.end_time - self.start_time).total_seconds()

        logger.info("=" * 80)
        logger.info("MIGRATION COMPLETED")
        logger.info("=" * 80)
        logger.info(f"Total Records:      {self.total_records}")
        logger.info(f"Successful:         {self.successful_migrations}")
        logger.info(f"Failed:             {self.failed_migrations}")
        logger.info(f"Skipped:            {self.skipped_records}")
        logger.info(f"Duration:           {duration:.2f} seconds")
        logger.info(f"Success Rate:       {self.success_rate:.2f}%")
        logger.info("=" * 80)

        if self.errors:
            logger.error(f"\n{len(self.errors)} ERRORS OCCURRED:")
            for i, error in enumerate(self.errors[:10], 1):
                logger.error(f"  {i}. {error}")
            if len(self.errors) > 10:
                logger.error(f"  ... and {len(self.errors) - 10} more errors")

    def record_success(self):
        """Record a successful migration"""
        self.successful_migrations += 1

    def record_failure(self, error_msg: str):
        """Record a failed migration"""
        self.failed_migrations += 1
        self.errors.append(error_msg)

    def record_skip(self):
        """Record a skipped record"""
        self.skipped_records += 1

    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_records == 0:
            return 0.0
        return (self.successful_migrations / self.total_records) * 100


class DataTransformer:
    """Transform data between MongoDB and PostgreSQL formats"""

    @staticmethod
    def convert_object_id_to_uuid(obj_id: Any) -> Optional[str]:
        """Convert MongoDB ObjectId to UUID string"""
        if obj_id is None:
            return None
        # Generate deterministic UUID from ObjectId string
        # This ensures the same ObjectId always maps to the same UUID
        obj_id_str = str(obj_id)
        namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # DNS namespace
        return str(uuid.uuid5(namespace, obj_id_str))

    @staticmethod
    def convert_datetime(dt: Any) -> Optional[datetime]:
        """Convert various datetime formats to Python datetime"""
        if dt is None:
            return None
        if isinstance(dt, datetime):
            return dt
        if isinstance(dt, str):
            try:
                return datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return None
        return None

    @staticmethod
    def clean_string(value: Any, max_length: Optional[int] = None) -> Optional[str]:
        """Clean and validate string values"""
        if value is None:
            return None
        value = str(value).strip()
        if max_length and len(value) > max_length:
            logger.warning(f"String truncated from {len(value)} to {max_length} chars")
            value = value[:max_length]
        return value if value else None

    @staticmethod
    def convert_boolean(value: Any) -> Optional[bool]:
        """Convert various boolean formats"""
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 't', 'y')
        return bool(value)

    @staticmethod
    def convert_integer(value: Any) -> Optional[int]:
        """Convert to integer with error handling"""
        if value is None:
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            logger.warning(f"Could not convert {value} to integer")
            return None

    @staticmethod
    def convert_float(value: Any) -> Optional[float]:
        """Convert to float with error handling"""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            logger.warning(f"Could not convert {value} to float")
            return None

    @staticmethod
    def ensure_dict(value: Any) -> Dict:
        """Ensure value is a dictionary"""
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        return {}

    @staticmethod
    def ensure_list(value: Any) -> List:
        """Ensure value is a list"""
        if value is None:
            return []
        if isinstance(value, list):
            return value
        return [value]


class MigrationValidator:
    """Validate migrated data"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Basic email validation"""
        if not email:
            return False
        return '@' in email and '.' in email

    @staticmethod
    def validate_uuid(uuid_str: str) -> bool:
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_str)
            return True
        except (ValueError, AttributeError):
            return False

    @staticmethod
    def validate_required_fields(data: Dict, required_fields: List[str]) -> List[str]:
        """Check for required fields, return list of missing fields"""
        missing = []
        for field in required_fields:
            if field not in data or data[field] is None:
                missing.append(field)
        return missing


class BatchProcessor:
    """Process records in batches for better performance"""

    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.current_batch = []

    def add(self, item: Any):
        """Add item to current batch"""
        self.current_batch.append(item)

    def is_full(self) -> bool:
        """Check if batch is full"""
        return len(self.current_batch) >= self.batch_size

    def get_batch(self) -> List:
        """Get current batch and reset"""
        batch = self.current_batch
        self.current_batch = []
        return batch

    def get_remaining(self) -> List:
        """Get remaining items in batch"""
        return self.current_batch


def create_progress_bar(total: int, current: int, bar_length: int = 50) -> str:
    """Create a text progress bar"""
    if total == 0:
        percent = 0
    else:
        percent = (current / total) * 100

    filled = int(bar_length * current / total) if total > 0 else 0
    bar = '█' * filled + '-' * (bar_length - filled)

    return f'[{bar}] {percent:.1f}% ({current}/{total})'


def safe_get(dictionary: Dict, key: str, default: Any = None) -> Any:
    """Safely get value from dictionary"""
    try:
        return dictionary.get(key, default)
    except AttributeError:
        return default
