var express = require('express');
var router = express.Router();
var Patron = require('../models').Patron;
var Loan = require('../models').Loan;
var Book = require('../models').Book;
var sequelize = require('sequelize');
var Op = sequelize.Op;

/* GET all patrons. */
router.get('/list/:id', function(req, res, next) {
  Promise.all([
    Patron.findAll({ offset: req.params.id*10,
                     limit: 10
    }),
    Patron.count()
  ])
  .then(function(results) {
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('patrons', {
            patrons: results[0],
            title: 'Patrons',
            pages: pageArr,
            activePage: parseInt(req.params.id),
            count: results[1],
            route: 'list',
            categories: [
                  {
                    value: 'first_name',
                    name: 'First Name'
                  },
                  {
                    value: 'last_name',
                    name: 'Last Name'
                  },
                  {
                    value: 'library_id',
                    name: 'Library ID'
                  }
            ],
            category: '',
            query: ''
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST all book search. */
router.post('/search/:id', function(req, res, next) {
  let category = req.body.category;
  let query = req.body.query;
  let categories = [
        {
          value: 'first_name',
          name: 'First Name'
        },
        {
          value: 'last_name',
          name: 'Last Name'
        },
        {
          value: 'library_id',
          name: 'Library ID'
        }
  ];

  function formatCategory (string) {
    let reformattedString = '';
    string.split("_").forEach(function(subStr) {
      if(subStr.charAt(0) === 'i')
        reformattedString += subStr.charAt(0).toUpperCase() + subStr.charAt(1).toUpperCase() + subStr.substr(2) + ' ';
      else
        reformattedString += subStr.charAt(0).toUpperCase() + subStr.substr(1) + ' ';
    });
    return reformattedString;
  }

  Promise.all([
    Patron.findAll({ offset: req.params.id*10,
                   limit: 10,
                   where: {
                     [category]: {
                       [Op.like]: `%${query.toLowerCase()}%`
                     }
                   }
    }),
    Patron.count({
      where: {
        [category]: {
          [Op.like]: `%${req.body.query.toLowerCase()}%`
        }
      }
    })
  ])
  .then(function(results) {
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('patrons', {
          patrons: results[0],
          title: `Patrons Based On the ${formatCategory(category)} Search: "${req.body.query}"`,
          pages: pageArr,
          activePage: parseInt(req.params.id),
          count: results[1],
          route: 'search',
          categories: categories,
          category: category,
          query: query
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET patron details. */
router.get('/detail/:id', function(req, res, next) {
  Loan.findAll({
    include: [
      {
        model: Book
      },
      {
        model: Patron
      }
    ],
    where: {
      patron_id: req.params.id
    }
  }).then(function(loans) {
    let patrons = loans.map(function(loan) {
      return loan.Patron;
    });
    let books = loans.map(function(loan) {
      return loan.Book;
    });
    if(patrons.length > 0)
      return res.render('patrons/detail', {
                            books: books,
                            loans: loans,
                            patrons: patrons,
                            patron: patrons[0],
                            title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`
      });
    else
      Patron.findAll({
        where: {
          id: req.params.id
        }
      }).then(function(patrons) {
          patrons = patrons;
          res.render('patrons/detail', {
                                books: books,
                                loans: loans,
                                patrons: patrons,
                                patron: patrons[0],
                                title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`
          });
      }).catch(function(error) {
          res.render('error', { title: 'Error', error: error });
      });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST update patron. */
router.post('/update/:id', function(req, res, next) {
  Patron
    .update(req.body, {
      where: {
        id: req.params.id
      }
    })
    .then(function() {
      return res.redirect('/patrons/list/0');
    })
    .catch(function(error) {
      if(error.name === "SequelizeValidationError" || error.name === 'SequelizeUniqueConstraintError') {
        let errorMsgs;
        if(error.name === 'SequelizeUniqueConstraintError')
          errorMsgs = [{ message: 'You must input a unique ID into the "Library ID" field.' }];
        else
          errorMsgs = error.errors;
        Loan.findAll({
          include: [
            {
              model: Book
            },
            {
              model: Patron
            }
          ],
          where: {
            patron_id: req.params.id
          }
        }).then(function(loans) {
          let patrons = loans.map(function(loan) {
            return loan.Patron;
          });
          let books = loans.map(function(loan) {
            return loan.Book;
          });
          if(patrons.length > 0)
            return res.render('patrons/detail', {
                patron: req.body,
                patrons: patrons,
                loans: loans,
                title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`,
                errors: errorMsgs
            });
          else
            Patron.findAll({
              where: {
                id: req.params.id
              }
            }).then(function(patrons) {
                return res.render('patrons/detail', {
                    patron: req.body,
                    loans: loans,
                    patrons: patrons,
                    title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`,
                    errors: errorMsgs
                });
            }).catch(function(error) {
                res.render('error', { title: 'Error', error: error });
            });
        }).catch(function(error) {
            res.render('error', { title: 'Error', error: error });
        });
      } else
        throw error;
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

/* GET new patron creation page. */
router.get('/new', function(req, res, next) {
  res.render('patrons/new', {
      patron: {},
      title: 'New Patron'
  });
});

/* POST create new patron. */
router.post('/new', function(req, res, next) {
  Patron
    .create(req.body)
    .then(function() {
      res.redirect('/patrons/list/0');
    })
    .catch(function(error) {
      if(error.name === "SequelizeValidationError")
        res.render('patrons/new', {
            patron: req.body,
            title: 'New Patron',
            errors: error.errors
        });
      else if(error.name === 'SequelizeUniqueConstraintError')
        res.render('patrons/new', {
            patron: req.body,
            title: 'New Patron',
            errors: [{ message: 'You must input a unique id into the "Library ID" field.'}]
        });
      else
        throw error;
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

module.exports = router;
