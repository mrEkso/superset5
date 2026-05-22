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


from typing import Any, Optional, Union

from flask import g

from superset.commands.base import BaseCommand
from superset.commands.chart.data.get_data_command import ChartDataCommand
from superset.commands.chart.exceptions import (
    ChartInvalidError,
    WarmUpCacheChartNotFoundError,
)
from superset.extensions import db
from superset.models.slice import Slice
from superset.utils import json
from superset.utils.core import error_msg_from_exception
from superset.views.utils import (
    get_dashboard_extra_filters,
    get_form_data,
    get_native_filter_extra_form_data,
    get_viz,
)
from superset.viz import viz_types


class ChartWarmUpCacheCommand(BaseCommand):
    def __init__(
        self,
        chart_or_id: Union[int, Slice],
        dashboard_id: Optional[int],
        extra_filters: Optional[str],
    ):
        self._chart_or_id = chart_or_id
        self._dashboard_id = dashboard_id
        self._extra_filters = extra_filters

    def run(self) -> dict[str, Any]:
        self.validate()
        chart: Slice = self._chart_or_id  # type: ignore

        try:
            form_data = get_form_data(chart.id, use_slice_data=True)[0]

            if form_data.get("viz_type") in viz_types:
                # Legacy visualizations.
                if not chart.datasource:
                    raise ChartInvalidError("Chart's datasource does not exist")

                if self._dashboard_id:
                    form_data["extra_filters"] = (
                        json.loads(self._extra_filters)
                        if self._extra_filters
                        else get_dashboard_extra_filters(chart.id, self._dashboard_id)
                    )

                g.form_data = form_data
                payload = get_viz(
                    datasource_type=chart.datasource.type,
                    datasource_id=chart.datasource.id,
                    form_data=form_data,
                    force=True,
                ).get_payload()
                delattr(g, "form_data")
                error = payload["errors"] or None
                status = payload["status"]
            else:
                # Non-legacy visualizations.
                if not chart.query_context:
                    raise ChartInvalidError("Chart's query context does not exist")

                try:
                    query_context_raw = json.loads(chart.query_context)
                except json.JSONDecodeError as ex:
                    raise ChartInvalidError(
                        "Chart's query context is malformed"
                    ) from ex

                if self._dashboard_id:
                    # Get legacy extra filters from dashboard metadata
                    extra_filters = (
                        json.loads(self._extra_filters)
                        if self._extra_filters
                        else get_dashboard_extra_filters(chart.id, self._dashboard_id)
                    )

                    # Get native filter defaults (time_range, filters, etc.)
                    native_extra = get_native_filter_extra_form_data(
                        chart.id, self._dashboard_id
                    )

                    # Inject filters into each query object in the raw JSON
                    # before QueryContext creation, so they flow through the
                    # same processing pipeline as the normal frontend path
                    # (QueryObjectFactory._process_time_range, etc.)
                    for query_dict in query_context_raw.get("queries", []):
                        # Apply native filter time_range override
                        if native_extra and "time_range" in native_extra:
                            query_dict["time_range"] = native_extra["time_range"]

                        # Merge native filter simple filters into query filters
                        if native_extra and "filters" in native_extra:
                            existing_filters = query_dict.get("filters", [])
                            existing_filters.extend(native_extra["filters"])
                            query_dict["filters"] = existing_filters

                        # Merge legacy extra filters into query filters
                        if extra_filters:
                            existing_filters = query_dict.get("filters", [])
                            existing_filters.extend(extra_filters)
                            query_dict["filters"] = existing_filters

                # Build QueryContext through the standard pipeline
                query_context = chart.get_query_context_factory().create(
                    **query_context_raw
                )

                if not query_context:
                    raise ChartInvalidError("Chart's query context does not exist")

                query_context.force = True
                command = ChartDataCommand(query_context)
                command.validate()
                payload = command.run()

                # Report the first error.
                for query in payload["queries"]:
                    error = query["error"]
                    status = query["status"]

                    if error is not None:
                        break
        except Exception as ex:  # pylint: disable=broad-except
            error = error_msg_from_exception(ex)
            status = None

        return {"chart_id": chart.id, "viz_error": error, "viz_status": status}

    def validate(self) -> None:
        if isinstance(self._chart_or_id, Slice):
            return
        chart = db.session.query(Slice).filter_by(id=self._chart_or_id).scalar()
        if not chart:
            raise WarmUpCacheChartNotFoundError()
        self._chart_or_id = chart
