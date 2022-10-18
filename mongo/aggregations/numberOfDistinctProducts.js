[
    {
      '$facet': {
        'totalCount': [
          {
            '$count': 'count'
          }
        ], 
        'totalDistinct': [
          {
            '$group': {
              '_id': '$translate.name'
            }
          }, {
            '$group': {
              '_id': null, 
              'allNames': {
                '$addToSet': '$_id'
              }
            }
          }, {
            '$project': {
              'count': {
                '$size': '$allNames'
              }
            }
          }
        ]
      }
    }, {
      '$project': {
        'totalCount': {
          '$arrayElemAt': [
            '$totalCount.count', 0
          ]
        }, 
        'totalDistinct': {
          '$arrayElemAt': [
            '$totalDistinct.count', 0
          ]
        }
      }
    }
  ]