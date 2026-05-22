#!/usr/bin/env python
"""
Post-init script to clear database-level cache timeouts.
This ensures all databases use the global DATA_CACHE_CONFIG settings
instead of per-database overrides.

This script runs after `superset init` to fix cache configuration.
"""

def main():
    from superset.app import create_app
    app = create_app()

    with app.app_context():
        from superset import db
        from superset.models.core import Database
        import json as json_lib
        import logging
        
        logger = logging.getLogger(__name__)
        logger.info("=== Post-Init: Clearing database-level cache timeouts ===")
        
        databases = db.session.query(Database).all()
        changes_made = False
        
        for database in databases:
            modified = False
            
            # Clear cache_timeout column if set
            if database.cache_timeout is not None:
                logger.info(f"Clearing cache_timeout={database.cache_timeout} for database [{database.id}] {database.database_name}")
                database.cache_timeout = None
                modified = True
            
            # Clear metadata_cache_timeout in extra JSON if set
            extra = database.get_extra()
            if extra.get('metadata_cache_timeout'):
                logger.info(f"Clearing metadata_cache_timeout for database [{database.id}] {database.database_name}")
                extra['metadata_cache_timeout'] = {}
                database.extra = json_lib.dumps(extra)
                modified = True
            
            if modified:
                changes_made = True
        
        if changes_made:
            db.session.commit()
            logger.info("=== Post-Init: Database cache settings cleared successfully ===")
        else:
            logger.info("=== Post-Init: No database cache settings to clear ===")
        
        # Print current config for verification
        print(f"Global DATA_CACHE_CONFIG: {app.config.get('DATA_CACHE_CONFIG')}")


if __name__ == "__main__":
    main()
