[
  {
    '$match': {
      'sold': true, 
      'complete': true, 
      'order.createdAt': {
        '$gte': new Date('Mon, 17 Oct 2022 01:00:00 GMT')
      }
    }
  }, {
    '$group': {
      '_id': '$sold', 
      'fullBenefit': {
        '$sum': '$benefitPrice'
      }, 
      'startDate': {
        '$min': '$order.createdAt'
      }, 
      'endDate': {
        '$max': '$order.createdAt'
      }
    }
  }, {
    '$project': {
      'fullBenefit': 1, 
      'startDate': 1, 
      'endDate': 1, 
      'range': {
        '$divide': [
          {
            '$subtract': [
              '$endDate', '$startDate'
            ]
          }, 86400000
        ]
      }
    }
  }
]