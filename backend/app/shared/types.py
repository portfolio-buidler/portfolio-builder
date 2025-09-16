from typing import Union, Dict, List
from pydantic import StrictStr

# Define JSON value types for JSONB fields in the database
JSONScalar = Union[StrictStr, int, float, bool, None]
JSONValue = Union[JSONScalar, List["JSONValue"], Dict[str, "JSONValue"]]