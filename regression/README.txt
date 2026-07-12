INDEX150 FIXED-CAMERA REGRESSION SET

Serve this folder over HTTP, then capture each URL after body[data-regression-ready="1"] appears:
  index.html?view=hall
  index.html?view=studioScreen
  ...

Desktop viewport: 1440x900. Mobile checks: 430x932 and 932x430.
The included capture_regression.sh uses Chromium when available.
