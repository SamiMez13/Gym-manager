from datetime import datetime, date
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

def to_camel_dict(obj: Any) -> Any:
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            parts = k.split("_")
            camel = parts[0] + "".join(p.title() for p in parts[1:]) if "_" in k else k
            new_dict[camel] = to_camel_dict(v)
        return new_dict
    if isinstance(obj, list):
        return [to_camel_dict(item) for item in obj]
    return obj
