# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import logging
from datetime import datetime
from typing import Any

from superset.commands.base import BaseCommand
from superset.commands.security.exceptions import RLSRuleNotFoundError
from superset.connectors.sqla.models import RowLevelSecurityFilter
from superset.daos.security import RLSDAO
from superset.extensions import db
from superset.utils.decorators import transaction

logger = logging.getLogger(__name__)


class DuplicateRLSRuleCommand(BaseCommand):
    """
    Command to duplicate a Row Level Security rule.
    Creates a deep copy with empty roles and a unique name.
    """

    def __init__(self, pk: int):
        self._pk = pk
        self._model: RowLevelSecurityFilter | None = None

    @transaction()
    def run(self) -> RowLevelSecurityFilter:
        self.validate()
        
        # Generate unique name with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_name = f"{self._model.name}_copy_{timestamp}"
        
        # Create duplicate with empty roles
        duplicate_data = {
            "name": new_name,
            "description": self._model.description,
            "filter_type": self._model.filter_type,
            "tables": list(self._model.tables),  # Copy tables
            "roles": [],  # Clear roles as per requirement
            "group_key": self._model.group_key,
            "clause": self._model.clause,
        }
        
        return RLSDAO.create(attributes=duplicate_data)

    def validate(self) -> None:
        self._model = db.session.query(RowLevelSecurityFilter).get(self._pk)
        if not self._model:
            raise RLSRuleNotFoundError()
