"use strict";

/**
 * Module dependencies.
 */
var qs = require('qs');

module.exports = function (res, fn) {
  res.text = '';
  res.setEncoding('ascii');
  res.on('data', function (chunk) {
    res.text += chunk;
  });
  res.on('end', function () {
    try {
      fn(null, qs.parse(res.text));
    } catch (err) {
      fn(err);
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9ub2RlL3BhcnNlcnMvdXJsZW5jb2RlZC5qcyJdLCJuYW1lcyI6WyJxcyIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVzIiwiZm4iLCJ0ZXh0Iiwic2V0RW5jb2RpbmciLCJvbiIsImNodW5rIiwicGFyc2UiLCJlcnIiXSwibWFwcGluZ3MiOiI7O0FBQUE7OztBQUlBLElBQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFDLElBQUQsQ0FBbEI7O0FBRUFDLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixVQUFDQyxHQUFELEVBQU1DLEVBQU4sRUFBYTtBQUM1QkQsRUFBQUEsR0FBRyxDQUFDRSxJQUFKLEdBQVcsRUFBWDtBQUNBRixFQUFBQSxHQUFHLENBQUNHLFdBQUosQ0FBZ0IsT0FBaEI7QUFDQUgsRUFBQUEsR0FBRyxDQUFDSSxFQUFKLENBQU8sTUFBUCxFQUFlLFVBQUFDLEtBQUssRUFBSTtBQUN0QkwsSUFBQUEsR0FBRyxDQUFDRSxJQUFKLElBQVlHLEtBQVo7QUFDRCxHQUZEO0FBR0FMLEVBQUFBLEdBQUcsQ0FBQ0ksRUFBSixDQUFPLEtBQVAsRUFBYyxZQUFNO0FBQ2xCLFFBQUk7QUFDRkgsTUFBQUEsRUFBRSxDQUFDLElBQUQsRUFBT0wsRUFBRSxDQUFDVSxLQUFILENBQVNOLEdBQUcsQ0FBQ0UsSUFBYixDQUFQLENBQUY7QUFDRCxLQUZELENBRUUsT0FBT0ssR0FBUCxFQUFZO0FBQ1pOLE1BQUFBLEVBQUUsQ0FBQ00sR0FBRCxDQUFGO0FBQ0Q7QUFDRixHQU5EO0FBT0QsQ0FiRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG5jb25zdCBxcyA9IHJlcXVpcmUoJ3FzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKHJlcywgZm4pID0+IHtcbiAgcmVzLnRleHQgPSAnJztcbiAgcmVzLnNldEVuY29kaW5nKCdhc2NpaScpO1xuICByZXMub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgcmVzLnRleHQgKz0gY2h1bms7XG4gIH0pO1xuICByZXMub24oJ2VuZCcsICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgZm4obnVsbCwgcXMucGFyc2UocmVzLnRleHQpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGZuKGVycik7XG4gICAgfVxuICB9KTtcbn07XG4iXX0=