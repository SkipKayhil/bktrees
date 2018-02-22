# Beta Kappa Family Trees

## Updating

1. Add new members/information to Membership archive
2. Export as a `.csv`
3. Run `python3 convert.py export.csv`
4. Push to git

## JSON Format

```
{
  ...
  "1940" : {
    "id" : "1940",
    "name" : "Gordon Nail",
    "big" : "1846",
    "children" : ["1956", "1986"],
    "active" : false
  },
  ...
}
```
