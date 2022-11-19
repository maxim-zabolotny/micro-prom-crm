[
    {
      '$match': {
        'order.createdAt': {
          '$gte': new Date('Mon, 17 Oct 2022 01:00:00 GMT')
        }
      }
    }, {
      '$facet': {
        'totalCount': [
          {
            '$count': 'count'
          }
        ], 
        'totalComplete': [
          {
            '$match': {
              'complete': true
            }
          }, {
            '$count': 'count'
          }
        ], 
        'totalSold': [
          {
            '$match': {
              'sold': true
            }
          }, {
            '$count': 'count'
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
        'totalComplete': {
          '$arrayElemAt': [
            '$totalComplete.count', 0
          ]
        }, 
        'totalSold': {
          '$arrayElemAt': [
            '$totalSold.count', 0
          ]
        }
      }
    }
  ]