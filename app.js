document.addEventListener("DOMContentLoaded", () => {
  const scoreDisplay = document.getElementById("score");
  const palyground = document.getElementById("playground");

  let score = 0;
  const width = 28;

  let ghosts = [];
  let pac_man = null;
  let current_key = null;
  let timerId = null;

  const directions = {
    l: { key: 'l', oposite: 'r' },
    r: { key: 'r', oposite: 'l' },
    u: { key: 'u', oposite: 'd' },
    d: { key: 'd', oposite: 'u' },
  }
  const field_counts = {
    power: { value: 10 },
    pac_dot: { value: 1 },
  }
  // order matters! index is relevant
  const field_codes = ["pac_dot", "wall", "ghost-area", "power", "empty"];
  const moveable_neighbors = ["ghost-area", "pac_dot", "power", "empty"];
  const available_ghosts = ["blinky", "pinky", "inky", "clyde"];
  const squares = [];

  let game_done = false

  // 0 = pac_dots
  // 1 = wall
  // 2 = ghost-area
  // 3 = power
  // 4 = empty
  const layout = [
    "1111111111111111111111111111",
    "1000000000000110000000000001",
    "1011110111110110111110111101",
    "1311110111110110111110111131",
    "1011110111110110111110111101",
    "1000000000000000000000000001",
    "1011110111111111111110111101",
    "1011110111111111111110111101",
    "1000000000000110000000000001",
    "1111110111110110111110111111",
    "1111110114444444444110111111",
    "1111110114111221114110111111",
    "1111110114122222214110111111",
    "4444440004122222214000444444",
    "1111110114122222214110111111",
    "1111110114122222214110111111",
    "1111110114111111114110111111",
    "1000000004444444444000000001",
    "1011110111110110111110111101",
    "1011110111110110111110111101",
    "1300110000000000000000110031",
    "1110110110111111110110110111",
    "1110110110111111110110110111",
    "1000000110000110000110000001",
    "1011111111110110111111111101",
    "1011111111110110111111111101",
    "1000000000000000000000000001",
    "1111111111111111111111111111",
  ];

  function createBoard() {
    layout.forEach((line) => {
      line.split("").forEach((field) => {
        const square = document.createElement("div");
        squares.push(square);

        playground.appendChild(square);
        square.classList.add(field_codes[field]);
      });
    });
  }

  function movableFields() {
    return squares.filter((f) => {
      return moveable_neighbors.includes(f.classList.item(0));
    });
  }

  class Ghost {
    constructor(class_name, current_index, speed = 500) {
      this.class_name = class_name;
      this.current_index = current_index;
      this.speed = speed;
      this.scarying = false;
      this.direction = '';
    }
  }

  class PacMan {
    constructor(current_index) {
      this.current_index = current_index;
      this.alive = true
    }
  }

  // filter ghosts from field class lists
  function filter_elements_classnames( class_list ) {
    let ret = []
    class_list.forEach( (c) => {
      if( field_codes.includes( c ) ) {
        ret.push(c)
      }
    })
    return ret
  }

  // finding fields around current position
  // easy find possible next fields for ghost and pac man
  function find_neighbors(current_pos) {
    let neighbors = {};
    let tmp_pos = current_pos % width == 0 ? current_pos + width - 1 : current_pos - 1;
    neighbors.l = { dir: 'l', pos: tmp_pos, ftype: filter_elements_classnames( squares[tmp_pos].classList )[0] || 'empty' };

    tmp_pos = current_pos % width == width - 1 ? current_pos - width + 1 : current_pos + 1;
    neighbors.r = { dir: 'r', pos: tmp_pos, ftype: filter_elements_classnames( squares[tmp_pos].classList )[0] || 'empty' };

    neighbors.u = { dir: 'u', pos: current_pos - width, ftype: filter_elements_classnames( squares[current_pos - width].classList )[0] || 'empty' };
    neighbors.d = { dir: 'd', pos: current_pos + width, ftype: filter_elements_classnames( squares[current_pos + width].classList )[0] || 'empty' };
    return neighbors;
  }

  function count_and_mark_field( idx ) {
    let field = squares[ idx ]
    counts = field_counts[ field.classList.item(0) ]
    if( counts && counts.value > 0 ) {
      score += counts.value
      field.classList.remove( field.classList.item(0) )
      scoreDisplay.innerHTML = score
    }
  }

  function check_collision_with_ghost( pac_man_pos ) {
    let done = ghosts.find( (g) => {
      return g.current_index == pac_man_pos
    })
    if( done ) {
      clearInterval( timerId )

      scoreDisplay.innerHTML = `${ score } - Game is done`
    }
  }

  function movePacMan() {
    let old_index = pac_man.current_index;
    let neighbors = find_neighbors(old_index);
    if ( current_key && moveable_neighbors.includes( neighbors[current_key].ftype ) ) {
      pac_man.current_index = neighbors[current_key].pos;
    }
    if (!current_key || old_index !== pac_man.current_index) {
      squares[old_index].classList.remove("pac-man");
      squares[pac_man.current_index].classList.add("pac-man");

      count_and_mark_field( pac_man.current_index )
    }
  }

  function moveGhosts() {
    ghosts.forEach((g) => {
      let neighbors = find_neighbors(g.current_index);
      let old_pos = g.current_index

      if( g.direction == '' ) {
        g.direction = ["l", "r", "u", "d"][Math.floor(Math.random() * 3)];
      }

      let possible_directions = Object.values(neighbors).filter((d) => {
        return moveable_neighbors.includes(d.ftype);
      });

      let filtered = possible_directions.filter((d) => d.dir != directions[ g.direction ].oposite)

      let nxt = null
      console.log( g.class_name, possible_directions, filtered, filtered.length )
      if ( filtered.length > 1 ) {
        nxt = filtered[ Math.floor( Math.random() * filtered.length ) ]
      } else {
        nxt = filtered[0]
        if( ! nxt ) { possible_directions[ 0 ]}
      }
      console.log( nxt )
      try {
        g.direction = nxt.dir;
        g.current_index = nxt.pos;
      } catch (e) {}

      squares[old_pos].classList.remove(g.class_name);
      squares[g.current_index].classList.add(g.class_name);
    });
  }

  function render() {
    movePacMan();
    check_collision_with_ghost(pac_man.current_index);
    moveGhosts();
    check_collision_with_ghost(pac_man.current_index);
  }

  function startGame() {
    createBoard();
    let af = movableFields();

    available_ghosts.forEach((f) => {
      let current_pos = Math.floor(Math.random() * af.length + 0.5);
      ghosts.push(new Ghost(f, squares.indexOf(af[current_pos])));
    });

    // let current_pos = Math.floor(Math.random() * af.length + 0.5);
    // ghosts.push(new Ghost('blinky', squares.indexOf(af[current_pos])));

    let pac_man_pos = Math.floor(Math.random() * af.length + 0.5);
    pac_man = new PacMan(squares.indexOf(af[pac_man_pos]));

    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          current_key = "l";
          break;
        case "ArrowRight":
          current_key = "r";
          break;
        case "ArrowUp":
          current_key = "u";
          break;
        case "ArrowDown":
          current_key = "d";
          break;
        default:
          break;
      }
    });

    timerId = setInterval(() => render(), 500);
  }

  startGame();
});
