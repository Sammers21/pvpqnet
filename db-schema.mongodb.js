// Select the database to use.
use('pvpq');
db.profile.createIndex( { region: -1 } )
db.profile.createIndex( { id: -1 } )
db.getCollection('3v3').createIndex({timestamp: -1})
db.getCollection('2v2').createIndex({timestamp: -1})
db.battlegrounds.createIndex({timestamp: -1})
db.shuffle.createIndex({timestamp: -1})
