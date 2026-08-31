pub struct SpatialHash {
    pub cell: f32,
    pub cols: usize,
    pub rows: usize,
    head: Vec<i32>,
    next: Vec<i32>,
}

impl SpatialHash {
    pub fn new(cap: usize) -> Self {
        Self {
            cell: 48.0,
            cols: 1,
            rows: 1,
            head: vec![-1],
            next: vec![-1; cap],
        }
    }

    pub fn configure(&mut self, width: f32, height: f32, cell: f32, cap: usize) {
        self.cell = cell.max(16.0);
        self.cols = ((width / self.cell).ceil() as usize).max(1);
        self.rows = ((height / self.cell).ceil() as usize).max(1);
        let cells = self.cols * self.rows;
        self.head.resize(cells, -1);
        if self.next.len() < cap {
            self.next.resize(cap, -1);
        }
    }

    pub fn clear(&mut self) {
        for h in self.head.iter_mut() {
            *h = -1;
        }
    }

    #[inline]
    pub fn cell_xy(&self, x: f32, y: f32) -> (isize, isize) {
        let cx = (x / self.cell).floor() as isize;
        let cy = (y / self.cell).floor() as isize;
        (cx, cy)
    }

    #[inline]
    pub fn index(&self, cx: isize, cy: isize) -> Option<usize> {
        if cx < 0 || cy < 0 {
            return None;
        }
        let ux = cx as usize;
        let uy = cy as usize;
        if ux >= self.cols || uy >= self.rows {
            return None;
        }
        Some(uy * self.cols + ux)
    }

    pub fn insert(&mut self, i: usize, x: f32, y: f32) {
        let (cx, cy) = self.cell_xy(x, y);
        if let Some(ci) = self.index(cx, cy) {
            self.next[i] = self.head[ci];
            self.head[ci] = i as i32;
        }
    }

    #[inline]
    pub fn head_at(&self, cx: isize, cy: isize) -> i32 {
        match self.index(cx, cy) {
            Some(i) => self.head[i],
            None => -1,
        }
    }

    #[inline]
    pub fn next_of(&self, i: usize) -> i32 {
        self.next[i]
    }
}
