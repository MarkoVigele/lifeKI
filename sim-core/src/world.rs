use crate::nn::{self, HID, IN, OUT, WEIGHTS};
use crate::params::*;
use crate::rng::Rng;
use crate::spatial::SpatialHash;

const TAU: f32 = std::f32::consts::TAU;

#[derive(Clone)]
pub struct Particle {
    pub id: u32,
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
    pub energy: f32,
    pub age: f32,
    pub health: f32,
    pub stress: f32,
    pub emo: [f32; EMO_COUNT],
    pub pers: [f32; PERS_COUNT],
    pub species: u8,
    pub bond: i32,
    pub generation: u16,
    pub parent_a: u32,
    pub parent_b: u32,
    pub signal_hue: f32,
    pub signal_amp: f32,
    pub honesty: f32,
    pub received: f32,
    pub dreaming: bool,
    pub lying: bool,
    pub frozen: u16,
    pub fitness: f32,
    pub beauty: f32,
    pub last_energy: f32,
    pub mem_reward: f32,
    pub idea: u8,
    pub weights: [f32; WEIGHTS],
}

#[derive(Clone)]
pub struct Fossil {
    pub weights: [f32; WEIGHTS],
    pub pers: [f32; PERS_COUNT],
    pub species: u8,
    pub fitness: f32,
    pub generation: u16,
    pub hue: f32,
}

struct Food {
    x: f32,
    y: f32,
    e: f32,
}

pub struct World {
    pub w: f32,
    pub h: f32,
    rng: Rng,
    tick: u32,
    day: f32,
    next_id: u32,
    params: [f32; PARAM_COUNT],
    matrix: [f32; SPECIES_MAX * SPECIES_MAX],
    particle_limit: usize,
    particles: Vec<Particle>,
    food: Vec<Food>,
    spatial: SpatialHash,
    scratch_in: [f32; IN],
    scratch_h: [f32; HID],
    scratch_o: [f32; OUT],
    render: Vec<f32>,
    food_render: Vec<f32>,
    events: Vec<f32>,
    event_n: usize,
    fossils: Vec<Fossil>,
    portals: [f32; 8],
    storm: [f32; 6],
    births: f32,
    deaths: f32,
    dreams: f32,
    lies: f32,
    alliances: f32,
    ideas: f32,
    max_gen: u16,
    food_acc: f32,
    stats: [f32; STAT_LEN],
}

impl World {
    pub fn new(width: f32, height: f32, count: u32, seed: u64) -> Self {
        let cap = PARTICLE_CAP;
        let mut world = Self {
            w: width.max(320.0),
            h: height.max(240.0),
            rng: Rng::new(seed),
            tick: 0,
            day: 0.2,
            next_id: 1,
            params: default_params(),
            matrix: default_matrix(),
            particle_limit: PARTICLE_CAP,
            particles: Vec::with_capacity(cap),
            food: Vec::with_capacity(FOOD_CAP),
            spatial: SpatialHash::new(cap),
            scratch_in: [0.0; IN],
            scratch_h: [0.0; HID],
            scratch_o: [0.0; OUT],
            render: vec![0.0; cap * RENDER_STRIDE],
            food_render: vec![0.0; FOOD_CAP * 3],
            events: vec![0.0; EV_CAP * EV_STRIDE],
            event_n: 0,
            fossils: Vec::with_capacity(FOSSIL_CAP),
            portals: [0.0; 8],
            storm: [0.0; 6],
            births: 0.0,
            deaths: 0.0,
            dreams: 0.0,
            lies: 0.0,
            alliances: 0.0,
            ideas: 0.0,
            max_gen: 0,
            food_acc: 0.0,
            stats: [0.0; STAT_LEN],
        };
        let n = (count as usize).clamp(8, cap);
        for i in 0..n {
            let p = world.spawn_fresh(i, n);
            world.particles.push(p);
        }
        let starter = ((n as f32 * 0.12) as usize + 40).min(160);
        for _ in 0..starter {
            world.spawn_food();
        }
        world.place_portals();
        world.write_render();
        world
    }

    fn spawn_fresh(&mut self, i: usize, n: usize) -> Particle {
        let species_n = self.species_n();
        let species = (i * species_n / n.max(1)) as u8;
        let cluster = species as f32 / species_n.max(1) as f32;
        let cx = self.w * (0.18 + 0.64 * ((cluster * 4.13).fract()));
        let cy = self.h * (0.2 + 0.6 * ((cluster * 7.91).fract()));
        let x = self.rng.range(cx - 70.0, cx + 70.0).rem_euclid(self.w);
        let y = self.rng.range(cy - 70.0, cy + 70.0).rem_euclid(self.h);
        self.make_particle(x, y, species, 0, 0, 0, None, None)
    }

    fn make_particle(
        &mut self,
        x: f32,
        y: f32,
        species: u8,
        generation: u16,
        parent_a: u32,
        parent_b: u32,
        weights: Option<[f32; WEIGHTS]>,
        pers: Option<[f32; PERS_COUNT]>,
    ) -> Particle {
        let id = self.next_id;
        self.next_id = self.next_id.wrapping_add(1);
        let mut wts = [0.0; WEIGHTS];
        match weights {
            Some(src) => wts.copy_from_slice(&src),
            None => nn::random_weights(&mut self.rng, &mut wts),
        }
        let personality = match pers {
            Some(p) => p,
            None => {
                let mut p = [0.0; PERS_COUNT];
                for v in p.iter_mut() {
                    *v = self.rng.range(0.15, 0.9);
                }
                p
            }
        };
        let mut emo = [0.2; EMO_COUNT];
        emo[E_HUNGER] = 0.4;
        emo[E_CURIOSITY] = personality[K_OPEN];
        Particle {
            id,
            x,
            y,
            vx: self.rng.signed() * 0.4,
            vy: self.rng.signed() * 0.4,
            energy: self.rng.range(0.55, 0.85),
            age: 0.0,
            health: 1.0,
            stress: 0.1,
            emo,
            pers: personality,
            species,
            bond: -1,
            generation,
            parent_a,
            parent_b,
            signal_hue: species_hue(species, self.species_n()),
            signal_amp: 0.0,
            honesty: 1.0,
            received: 0.0,
            dreaming: false,
            lying: false,
            frozen: 0,
            fitness: 0.0,
            beauty: 0.5,
            last_energy: 0.7,
            mem_reward: 0.0,
            idea: 0,
            weights: wts,
        }
    }

    fn species_n(&self) -> usize {
        (self.params[P_SPECIES_COUNT] as usize).clamp(2, SPECIES_MAX)
    }

    fn spawn_food(&mut self) {
        if self.food.len() >= FOOD_CAP {
            return;
        }
        self.food.push(Food {
            x: self.rng.f32() * self.w,
            y: self.rng.f32() * self.h,
            e: self.rng.range(0.35, 1.0),
        });
    }

    fn replenish_food(&mut self, dt: f32) {
        let n = self.particles.len() as f32;
        let rate = self.params[P_FOOD_RATE].clamp(0.0, 1.6);
        self.food_acc += rate * dt * (0.85 + n * 0.009);
        while self.food_acc >= 1.0 && self.food.len() < FOOD_CAP {
            self.spawn_food();
            self.food_acc -= 1.0;
        }
        let floor = ((12.0 + n * 0.07) as usize).min(160).min(FOOD_CAP);
        while self.food.len() < floor {
            self.spawn_food();
        }
        if self.food.len() > 180 {
            self.food.truncate(180);
        }
    }

    fn place_portals(&mut self) {
        self.portals[0] = self.rng.range(self.w * 0.15, self.w * 0.4);
        self.portals[1] = self.rng.range(self.h * 0.15, self.h * 0.4);
        self.portals[2] = self.rng.range(self.w * 0.6, self.w * 0.88);
        self.portals[3] = self.rng.range(self.h * 0.55, self.h * 0.88);
        self.portals[4] = 1.0;
        self.portals[5] = self.rng.f32();
        self.portals[6] = 0.0;
        self.portals[7] = 0.0;
    }

    pub fn set_params(&mut self, data: &[f32]) {
        let n = data.len().min(PARAM_COUNT);
        self.params[..n].copy_from_slice(&data[..n]);
    }

    pub fn set_matrix(&mut self, data: &[f32]) {
        let n = data.len().min(self.matrix.len());
        self.matrix[..n].copy_from_slice(&data[..n]);
    }

    fn spawn_cap(&self) -> usize {
        self.particle_limit.min(PARTICLE_CAP)
    }

    pub fn set_particle_limit(&mut self, n: u32) {
        self.particle_limit = (n as usize).clamp(8, PARTICLE_CAP);
    }

    pub fn particle_limit(&self) -> u32 {
        self.spawn_cap() as u32
    }

    pub fn resize(&mut self, width: f32, height: f32) {
        self.w = width.max(320.0);
        self.h = height.max(240.0);
        for p in self.particles.iter_mut() {
            p.x = p.x.rem_euclid(self.w);
            p.y = p.y.rem_euclid(self.h);
        }
    }

    pub fn seed_count(&mut self, count: u32) {
        let want = (count as usize).clamp(8, self.spawn_cap());
        if self.particles.len() > want {
            self.particles.truncate(want);
        }
        while self.particles.len() < want {
            let i = self.particles.len();
            let p = self.spawn_fresh(i, want);
            self.particles.push(p);
        }
    }

    fn emit(&mut self, kind: f32, x: f32, y: f32, hue: f32, mag: f32) {
        if self.event_n >= EV_CAP {
            return;
        }
        let o = self.event_n * EV_STRIDE;
        self.events[o] = kind;
        self.events[o + 1] = x;
        self.events[o + 2] = y;
        self.events[o + 3] = hue;
        self.events[o + 4] = mag;
        self.event_n += 1;
    }

    pub fn step(&mut self) {
        self.event_n = 0;
        let dt = self.params[P_TIME_SCALE].clamp(0.0, 3.5);
        if dt <= 0.0001 {
            self.write_render();
            self.write_stats();
            return;
        }

        self.tick = self.tick.wrapping_add(1);
        self.day = (self.day + self.params[P_DAY_SPEED] * dt).rem_euclid(1.0);

        let perc = self.params[P_PERCEPTION].clamp(18.0, 140.0);
        self.spatial
            .configure(self.w, self.h, (perc * 0.85).max(24.0), PARTICLE_CAP);
        self.spatial.clear();
        for (i, p) in self.particles.iter().enumerate() {
            self.spatial.insert(i, p.x, p.y);
        }

        self.replenish_food(dt);
        self.tick_environment(dt);
        self.sense_and_act(dt);
        self.integrate(dt);
        self.interact(dt);
        self.cull_and_age(dt);
        self.write_render();
        self.write_stats();
    }

    fn tick_environment(&mut self, dt: f32) {
        if self.portals[4] > 0.0 {
            self.portals[6] = (self.portals[6] + dt * 0.04).rem_euclid(1.0);
        }
        if self.rng.chance(self.params[P_PORTAL_RATE] * 0.0012 * dt) {
            self.place_portals();
            self.emit(7.0, self.portals[0], self.portals[1], 0.55, 1.0);
        }
        if self.storm[3] > 0.0 {
            self.storm[2] += dt;
            if self.storm[2] >= self.storm[3] {
                self.storm = [0.0; 6];
            }
        } else if self.rng.chance(self.params[P_CATASTROPHE_RATE] * 0.0009 * dt) {
            let kind = 1.0 + (self.rng.f32() * 4.0).floor();
            let sx = self.rng.f32() * self.w;
            let sy = self.rng.f32() * self.h;
            self.trigger_event(kind as u32, sx, sy);
        }
    }

    fn sense_and_act(&mut self, dt: f32) {
        let n = self.particles.len();
        let perc = self.params[P_PERCEPTION].clamp(18.0, 140.0);
        let perc2 = perc * perc;
        let rep_r = self.params[P_REPULSION].clamp(4.0, 40.0);
        let force_s = self.params[P_FORCE_SCALE];
        let nn_inf = self.params[P_NN_INFLUENCE];
        let species_n = self.species_n();
        let mood = (self.params[P_GOD_MOOD] + 0.22 * (self.day * TAU).sin()).clamp(-1.0, 1.0);
        let night = (1.0 - (self.day * TAU).cos()) * 0.5;
        let emp_r = self.params[P_EMPATHY_RADIUS];
        let emp_c = self.params[P_EMPATHY_CONTAGION];
        let lie_t = self.params[P_LIE_TENDENCY];
        let sig_c = self.params[P_SIGNAL_COMPLEXITY];
        let dream_f = self.params[P_DREAM_FREQ];
        let dream_i = self.params[P_DREAM_INTENSITY];
        let hebb = self.params[P_HEBBIAN];
        let culture = self.params[P_CULTURE_RATE];
        let chaos = self.params[P_CHAOS];
        let mem_decay = self.params[P_MEMORY_DECAY];
        let beauty_s = self.params[P_BEAUTY_SELECT];
        let w = self.w;
        let h = self.h;

        let mut forces: Vec<(f32, f32)> = vec![(0.0, 0.0); n];
        let mut received = vec![0.0f32; n];
        let mut density = vec![0.0f32; n];
        let mut kin_d = vec![9999.0f32; n];
        let mut oth_d = vec![9999.0f32; n];
        let mut food_d = vec![9999.0f32; n];
        let mut kin_dx = vec![0.0f32; n];
        let mut kin_dy = vec![0.0f32; n];
        let mut oth_dx = vec![0.0f32; n];
        let mut oth_dy = vec![0.0f32; n];
        let mut food_dx = vec![0.0f32; n];
        let mut food_dy = vec![0.0f32; n];
        let mut rich_idx = vec![-1i32; n];
        let mut rich_e = vec![-1.0f32; n];
        let mut emp_sum = vec![[0.0f32; EMO_COUNT]; n];
        let mut emp_n = vec![0.0f32; n];
        let mut hue_var = vec![0.0f32; n];

        for i in 0..n {
            let px = self.particles[i].x;
            let py = self.particles[i].y;
            let si = self.particles[i].species as usize % SPECIES_MAX;
            let (cx, cy) = self.spatial.cell_xy(px, py);
            let mut fx = 0.0;
            let mut fy = 0.0;
            let mut dens = 0.0;
            let mut best_kin = 1.0e9;
            let mut best_oth = 1.0e9;
            let mut kdx = 0.0;
            let mut kdy = 0.0;
            let mut odx = 0.0;
            let mut ody = 0.0;
            let mut recv = 0.0;
            let mut rich = -1i32;
            let mut riche = self.particles[i].energy;
            let mut emps = [0.0; EMO_COUNT];
            let mut empn = 0.0;
            let mut hvar = 0.0;
            let my_hue = species_hue(self.particles[i].species, species_n);

            for oy in -1..=1 {
                for ox in -1..=1 {
                    let mut j = self.spatial.head_at(cx + ox, cy + oy);
                    while j >= 0 {
                        let uj = j as usize;
                        j = self.spatial.next_of(uj);
                        if uj == i {
                            continue;
                        }
                        let dx = wrap_delta(px, self.particles[uj].x, w);
                        let dy = wrap_delta(py, self.particles[uj].y, h);
                        let d2 = dx * dx + dy * dy;
                        if d2 > perc2 || d2 < 0.0001 {
                            continue;
                        }
                        let d = d2.sqrt();
                        dens += 1.0;
                        let sj = self.particles[uj].species as usize % SPECIES_MAX;
                        let m = self.matrix[si * SPECIES_MAX + sj];
                        let mut f = m * (1.0 - d / perc) * force_s;
                        if d < rep_r {
                            f -= (rep_r - d) / rep_r * 1.35;
                        }
                        fx += dx / d * f;
                        fy += dy / d * f;

                        if si == sj {
                            if d < best_kin {
                                best_kin = d;
                                kdx = dx / d;
                                kdy = dy / d;
                            }
                        } else if d < best_oth {
                            best_oth = d;
                            odx = dx / d;
                            ody = dy / d;
                        }

                        recv += self.particles[uj].signal_amp
                            * (1.0 - d / perc)
                            * (0.55 + 0.45 * ((self.particles[uj].signal_hue - my_hue).abs() * -2.0 + 1.0).max(0.0));

                        if self.particles[uj].energy > riche + 0.08 {
                            riche = self.particles[uj].energy;
                            rich = uj as i32;
                        }

                        if d < emp_r {
                            for e in 0..EMO_COUNT {
                                emps[e] += self.particles[uj].emo[e];
                            }
                            empn += 1.0;
                            hvar += hue_dist(my_hue, species_hue(self.particles[uj].species, species_n));
                        }
                    }
                }
            }

            let mut fdx = 0.0;
            let mut fdy = 0.0;
            let mut fd = 1.0e9;
            for food in self.food.iter() {
                let dx = wrap_delta(px, food.x, w);
                let dy = wrap_delta(py, food.y, h);
                let d2 = dx * dx + dy * dy;
                if d2 < fd * fd && d2 < perc2 * 1.6 {
                    fd = d2.sqrt();
                    if fd > 0.001 {
                        fdx = dx / fd;
                        fdy = dy / fd;
                    }
                }
            }

            forces[i] = (fx, fy);
            density[i] = dens;
            kin_d[i] = best_kin;
            oth_d[i] = best_oth;
            kin_dx[i] = kdx;
            kin_dy[i] = kdy;
            oth_dx[i] = odx;
            oth_dy[i] = ody;
            food_d[i] = fd;
            food_dx[i] = fdx;
            food_dy[i] = fdy;
            received[i] = recv.tanh();
            rich_idx[i] = rich;
            rich_e[i] = riche;
            emp_sum[i] = emps;
            emp_n[i] = empn;
            hue_var[i] = if empn > 0.0 { hvar / empn } else { 0.4 };
        }

        let mut dreamers: Vec<usize> = Vec::new();
        let mut idea_burst: Vec<usize> = Vec::new();
        let mut culture_pairs: Vec<(usize, usize, f32)> = Vec::new();
        let mut bonds: Vec<usize> = Vec::new();
        let mut break_bonds: Vec<usize> = Vec::new();
        let mut lie_hits: Vec<usize> = Vec::new();

        for i in 0..n {
            if self.particles[i].frozen > 0 {
                self.particles[i].frozen -= 1;
                continue;
            }

            let dens_n = (density[i] / 14.0).tanh();
            let hunger = (1.0 - self.particles[i].energy).clamp(0.0, 1.0);
            let biome = biome_at(self.particles[i].x, self.particles[i].y, w, h);

            let mut emo = self.particles[i].emo;
            let pers = self.particles[i].pers;
            emo[E_HUNGER] = lerp(emo[E_HUNGER], hunger, 0.2);
            emo[E_FEAR] = lerp(
                emo[E_FEAR],
                dens_n * (0.25 + pers[K_CAUTION] * 0.7) + night * 0.15 - mood * 0.12,
                0.12,
            );
            emo[E_AGGRO] = lerp(
                emo[E_AGGRO],
                pers[K_FEROCITY] * (0.25 + hunger * 0.4) - mood * 0.1 + biome.volatile * 0.1,
                0.1,
            );
            emo[E_BELONG] = lerp(
                emo[E_BELONG],
                pers[K_LOYALTY] * (0.3 + (1.0 - (kin_d[i] / perc).min(1.0)) * 0.5) + mood * 0.08,
                0.1,
            );
            emo[E_CURIOSITY] = lerp(
                emo[E_CURIOSITY],
                pers[K_OPEN] * (0.35 + (1.0 - dens_n) * 0.4) + (1.0 - night) * 0.08,
                0.1,
            );
            emo[E_PLAY] = lerp(
                emo[E_PLAY],
                pers[K_WHIMSY] * self.particles[i].energy * (1.0 - self.particles[i].stress) * (0.4 + mood * 0.2),
                0.1,
            );
            emo[E_DOM] = lerp(
                emo[E_DOM],
                self.particles[i].energy * (0.2 + dens_n * 0.4) * (1.0 - emo[E_FEAR]),
                0.08,
            );

            if emp_n[i] > 0.0 && emp_c > 0.0 {
                let inv = 1.0 / emp_n[i];
                for e in 0..EMO_COUNT {
                    emo[e] = lerp(emo[e], emp_sum[i][e] * inv, emp_c * 0.15);
                }
            }
            for e in 0..EMO_COUNT {
                emo[e] = emo[e].clamp(0.0, 1.0);
            }
            self.particles[i].emo = emo;
            self.particles[i].received = received[i];
            self.particles[i].stress = (emo[E_FEAR] * 0.55 + hunger * 0.3 + (1.0 - self.particles[i].honesty) * 0.2)
                .clamp(0.0, 1.0);
            self.particles[i].health = (self.particles[i].energy * (1.0 - self.particles[i].stress * 0.35)).clamp(0.0, 1.0);

            let true_hue = emotion_hue(&emo, species_hue(self.particles[i].species, species_n));
            self.scratch_in[0] = food_dx[i];
            self.scratch_in[1] = food_dy[i];
            self.scratch_in[2] = (food_d[i] / perc).min(1.5) * 0.66 - 0.1;
            self.scratch_in[3] = kin_dx[i];
            self.scratch_in[4] = kin_dy[i];
            self.scratch_in[5] = (kin_d[i] / perc).min(1.5) * 0.66 - 0.1;
            self.scratch_in[6] = oth_dx[i];
            self.scratch_in[7] = oth_dy[i];
            self.scratch_in[8] = (oth_d[i] / perc).min(1.5) * 0.66 - 0.1;
            self.scratch_in[9] = self.particles[i].energy * 2.0 - 1.0;
            self.scratch_in[10] = self.particles[i].stress * 2.0 - 1.0;
            self.scratch_in[11] = dens_n * 2.0 - 1.0;
            self.scratch_in[12] = received[i] * 2.0 - 0.4;
            self.scratch_in[13] = (self.day * TAU).sin();
            self.scratch_in[14] = emo[E_HUNGER] * 2.0 - 1.0;
            self.scratch_in[15] = emo[E_FEAR] * 2.0 - 1.0;

            let (ffx, ffy) = forces[i];
            let mut nx = 0.0;
            let mut ny = 0.0;
            if n <= 1400 || ((self.tick as usize) + i) % 2 == 0 {
                nn::infer(
                    &self.particles[i].weights,
                    &self.scratch_in,
                    &mut self.scratch_h,
                    &mut self.scratch_o,
                );
                nx = self.scratch_o[0] * nn_inf * (0.7 + emo[E_CURIOSITY] * 0.5);
                ny = self.scratch_o[1] * nn_inf * (0.7 + emo[E_CURIOSITY] * 0.5);
            }
            let steer_x = ffx + nx;
            let steer_y = ffy + ny;
            let play_j = emo[E_PLAY] * 0.12;
            self.particles[i].vx += (steer_x + self.rng.signed() * play_j) * dt;
            self.particles[i].vy += (steer_y + self.rng.signed() * play_j) * dt;

            if emo[E_FEAR] > 0.55 && oth_d[i] < perc * 0.7 {
                self.particles[i].vx -= oth_dx[i] * emo[E_FEAR] * 0.18 * dt;
                self.particles[i].vy -= oth_dy[i] * emo[E_FEAR] * 0.18 * dt;
            }
            if emo[E_AGGRO] > 0.55 && oth_d[i] < perc {
                self.particles[i].vx += oth_dx[i] * emo[E_AGGRO] * 0.16 * dt;
                self.particles[i].vy += oth_dy[i] * emo[E_AGGRO] * 0.16 * dt;
            }
            if emo[E_HUNGER] > 0.35 && food_d[i] < perc * 1.3 {
                self.particles[i].vx += food_dx[i] * emo[E_HUNGER] * 0.2 * dt;
                self.particles[i].vy += food_dy[i] * emo[E_HUNGER] * 0.2 * dt;
            }
            if emo[E_BELONG] > 0.5 && kin_d[i] < perc {
                self.particles[i].vx += kin_dx[i] * emo[E_BELONG] * 0.08 * dt;
                self.particles[i].vy += kin_dy[i] * emo[E_BELONG] * 0.08 * dt;
            }

            let lie_p = lie_t * (0.15 + pers[K_GREED] * 0.5 + emo[E_FEAR] * 0.25 + (1.0 - pers[K_LOYALTY]) * 0.2);
            let lying = self.scratch_o[4] < (lie_p * 2.0 - 1.0) * 0.85 || self.rng.chance(lie_p * 0.08);
            self.particles[i].lying = lying;
            if lying {
                self.particles[i].signal_hue = (true_hue + 0.42 + self.rng.range(-0.08, 0.08)).rem_euclid(1.0);
                self.particles[i].honesty = lerp(self.particles[i].honesty, 0.08, 0.3);
                if self.rng.chance(0.08 * dt) {
                    lie_hits.push(i);
                }
            } else {
                self.particles[i].signal_hue = lerp_hue(self.particles[i].signal_hue, true_hue, 0.25);
                self.particles[i].honesty = lerp(self.particles[i].honesty, 0.92, 0.15);
            }
            self.particles[i].signal_amp =
                ((self.scratch_o[3] * 0.5 + 0.5) * sig_c * (0.35 + emo[E_DOM] * 0.4 + emo[E_BELONG] * 0.2)).clamp(0.0, 1.2);

            if self.scratch_o[7] > 0.15
                && dens_n < 0.38
                && self.particles[i].energy > 0.28
                && self.rng.chance(dream_f * 0.12 * dt)
            {
                self.particles[i].dreaming = true;
                dreamers.push(i);
            } else {
                self.particles[i].dreaming = false;
            }

            let reward = (self.particles[i].energy - self.particles[i].last_energy) * 14.0
                + self.particles[i].beauty * beauty_s * 0.15;
            self.particles[i].mem_reward = lerp(self.particles[i].mem_reward, reward, 1.0 - mem_decay.clamp(0.0, 0.9));
            nn::hebbian(
                &mut self.particles[i].weights,
                &self.scratch_in,
                &self.scratch_h,
                &self.scratch_o,
                hebb * 0.045,
                reward,
            );

            if rich_idx[i] >= 0 && culture > 0.0 && self.rng.chance(culture * 0.05 * dt) {
                culture_pairs.push((i, rich_idx[i] as usize, culture * 0.08));
            }

            if self.scratch_o[6] > 0.35
                && kin_d[i] < perc * 0.55
                && self.particles[i].bond < 0
                && emo[E_BELONG] > 0.4
            {
                // find closest kin again via stored vector — bond later using neighbor scan
                bonds.push(i);
            }
            if self.particles[i].bond >= 0
                && (emo[E_AGGRO] > 0.78 || self.particles[i].honesty < 0.2)
                && self.rng.chance(0.02 * dt)
            {
                break_bonds.push(i);
            }

            if self.rng.chance(chaos * 0.0007 * dt) {
                idea_burst.push(i);
            }

            let smooth = 1.0 - (self.particles[i].vx.hypot(self.particles[i].vy) / 4.0).min(1.0) * 0.3;
            self.particles[i].beauty = lerp(
                self.particles[i].beauty,
                (1.0 - hue_var[i]) * 0.55 + (1.0 - self.particles[i].stress) * 0.25 + smooth * 0.2,
                0.08,
            );
            self.particles[i].fitness += (self.particles[i].energy * 0.002
                + self.particles[i].beauty * beauty_s * 0.003
                + if self.particles[i].bond >= 0 { 0.0008 } else { 0.0 })
                * dt;
        }

        for i in dreamers {
            let reward = self.particles[i].mem_reward;
            nn::hebbian(
                &mut self.particles[i].weights,
                &self.scratch_in,
                &self.scratch_h,
                &self.scratch_o,
                dream_i * 0.03,
                reward,
            );
            nn::mutate(
                &mut self.particles[i].weights,
                &mut self.rng,
                0.015 * dream_i,
                self.params[P_MUTATION_POETRY] * 0.4,
            );
            self.particles[i].stress *= 0.9;
            self.particles[i].energy = (self.particles[i].energy + 0.004).min(1.2);
            self.dreams += 1.0;
            self.emit(
                4.0,
                self.particles[i].x,
                self.particles[i].y,
                self.particles[i].signal_hue,
                0.7,
            );
        }

        for (i, j, t) in culture_pairs {
            if j < self.particles.len() && i < self.particles.len() && i != j {
                let src = self.particles[j].weights;
                nn::lerp_weights(&mut self.particles[i].weights, &src, t);
            }
        }

        for i in idea_burst {
            nn::mutate(
                &mut self.particles[i].weights,
                &mut self.rng,
                0.28,
                self.params[P_MUTATION_POETRY].max(0.5),
            );
            self.particles[i].idea = 24;
            self.particles[i].emo[E_CURIOSITY] = 1.0;
            self.ideas += 1.0;
            self.emit(8.0, self.particles[i].x, self.particles[i].y, 0.12, 1.1);
        }

        for i in lie_hits {
            self.lies += 1.0;
            self.emit(5.0, self.particles[i].x, self.particles[i].y, 0.95, 0.6);
        }

        // Resolve new bonds from belonging particles
        for i in bonds {
            if self.particles[i].bond >= 0 {
                continue;
            }
            let perc_b = perc * 0.5;
            let (cx, cy) = self.spatial.cell_xy(self.particles[i].x, self.particles[i].y);
            let mut best = -1i32;
            let mut bestd = perc_b;
            for oy in -1..=1 {
                for ox in -1..=1 {
                    let mut j = self.spatial.head_at(cx + ox, cy + oy);
                    while j >= 0 {
                        let uj = j as usize;
                        j = self.spatial.next_of(uj);
                        if uj == i || self.particles[uj].bond >= 0 {
                            continue;
                        }
                        if self.particles[uj].species != self.particles[i].species {
                            continue;
                        }
                        let dx = wrap_delta(self.particles[i].x, self.particles[uj].x, w);
                        let dy = wrap_delta(self.particles[i].y, self.particles[uj].y, h);
                        let d = dx.hypot(dy);
                        if d < bestd && self.particles[uj].emo[E_BELONG] > 0.32 {
                            bestd = d;
                            best = uj as i32;
                        }
                    }
                }
            }
            if best >= 0 {
                let j = best as usize;
                self.particles[i].bond = j as i32;
                self.particles[j].bond = i as i32;
                self.alliances += 1.0;
                self.emit(6.0, self.particles[i].x, self.particles[i].y, 0.12, 0.7);
            }
        }

        for i in break_bonds {
            self.break_bond(i);
        }

        // idea contagion
        for i in 0..n {
            if self.particles[i].idea > 0 {
                self.particles[i].idea -= 1;
            }
        }
    }

    fn integrate(&mut self, dt: f32) {
        let friction = self.params[P_FRICTION].clamp(0.5, 0.98);
        let max_speed = self.params[P_MAX_SPEED].clamp(0.4, 6.0);
        let drain = self.params[P_ENERGY_DRAIN];
        let w = self.w;
        let h = self.h;
        let mood = self.params[P_GOD_MOOD];

        let storm = self.storm;
        let portals = self.portals;
        let n = self.particles.len();
        for i in 0..n {
            if self.particles[i].frozen > 0 {
                self.particles[i].vx *= 0.5;
                self.particles[i].vy *= 0.5;
            }
            self.particles[i].vx *= friction.powf(dt);
            self.particles[i].vy *= friction.powf(dt);
            let sp = self.particles[i].vx.hypot(self.particles[i].vy);
            if sp > max_speed {
                self.particles[i].vx *= max_speed / sp;
                self.particles[i].vy *= max_speed / sp;
            }
            self.particles[i].x = (self.particles[i].x + self.particles[i].vx * dt * 2.15).rem_euclid(w);
            self.particles[i].y = (self.particles[i].y + self.particles[i].vy * dt * 2.15).rem_euclid(h);

            let biome = biome_at(self.particles[i].x, self.particles[i].y, w, h);
            let drain_now = drain * (1.0 + biome.barren * 0.8 - biome.fertile * 0.35 - mood * 0.08)
                * (1.0 + self.particles[i].stress * 0.4)
                * (1.0 + self.particles[i].signal_amp * 0.15);
            self.particles[i].energy -= drain_now * dt;
            self.particles[i].age += dt;

            if storm[3] > 0.0 {
                let dx = wrap_delta(self.particles[i].x, storm[0], w);
                let dy = wrap_delta(self.particles[i].y, storm[1], h);
                let d = dx.hypot(dy).max(8.0);
                let kind = storm[4];
                if kind == 1.0 && d < storm[5] {
                    self.particles[i].vx += dx / d * 0.9 * dt;
                    self.particles[i].vy += dy / d * 0.9 * dt;
                } else if kind == 4.0 && d < storm[5] {
                    self.particles[i].energy -= 0.01 * dt;
                    self.particles[i].stress = (self.particles[i].stress + 0.02 * dt).min(1.0);
                }
            }

            if portals[4] > 0.0 {
                let px = self.particles[i].x;
                let py = self.particles[i].y;
                let d1 = wrap_delta(px, portals[0], w).hypot(wrap_delta(py, portals[1], h));
                let d2 = wrap_delta(px, portals[2], w).hypot(wrap_delta(py, portals[3], h));
                let roll_a = self.rng.chance(0.08 * dt);
                let roll_b = self.rng.chance(0.08 * dt);
                let jx = self.rng.signed() * 10.0;
                let jy = self.rng.signed() * 10.0;
                if d1 < 16.0 && roll_a {
                    self.particles[i].x = portals[2] + jx;
                    self.particles[i].y = portals[3] + jy;
                    self.particles[i].emo[E_CURIOSITY] = 1.0;
                } else if d2 < 16.0 && roll_b {
                    self.particles[i].x = portals[0] + jx;
                    self.particles[i].y = portals[1] + jy;
                }
            }

            self.particles[i].last_energy = self.particles[i].energy;
        }
    }

    fn interact(&mut self, dt: f32) {
        let eat_r = 9.0;
        let combat = self.params[P_COMBAT];
        let altruism = self.params[P_ALTRUISM];
        let lie_pen = self.params[P_LIE_PENALTY];
        let food_e = self.params[P_FOOD_ENERGY];
        let w = self.w;
        let h = self.h;
        let n = self.particles.len();

        // eat via the particle spatial hash — not O(particles × food)
        let eat2 = eat_r * eat_r;
        let mut kept = Vec::with_capacity(self.food.len());
        for food in self.food.drain(..) {
            let (cx, cy) = self.spatial.cell_xy(food.x, food.y);
            let mut taken = false;
            'near: for oy in -1..=1 {
                for ox in -1..=1 {
                    let mut j = self.spatial.head_at(cx + ox, cy + oy);
                    while j >= 0 {
                        let uj = j as usize;
                        j = self.spatial.next_of(uj);
                        if uj >= n {
                            continue;
                        }
                        let dx = wrap_delta(food.x, self.particles[uj].x, w);
                        let dy = wrap_delta(food.y, self.particles[uj].y, h);
                        if dx * dx + dy * dy < eat2 {
                            self.particles[uj].energy =
                                (self.particles[uj].energy + food.e * food_e).min(1.35);
                            self.particles[uj].emo[E_HUNGER] *= 0.45;
                            taken = true;
                            break 'near;
                        }
                    }
                }
            }
            if !taken {
                kept.push(food);
            }
        }
        self.food = kept;

        // combat / altruism / lie detect / bond pull
        let mut energy_delta = vec![0.0f32; n];
        for i in 0..n {
            let (cx, cy) = self.spatial.cell_xy(self.particles[i].x, self.particles[i].y);
            for oy in -1..=1 {
                for ox in -1..=1 {
                    let mut j = self.spatial.head_at(cx + ox, cy + oy);
                    while j >= 0 {
                        let uj = j as usize;
                        j = self.spatial.next_of(uj);
                        if uj <= i {
                            continue;
                        }
                        let dx = wrap_delta(self.particles[i].x, self.particles[uj].x, w);
                        let dy = wrap_delta(self.particles[i].y, self.particles[uj].y, h);
                        let d = dx.hypot(dy);
                        if d > 16.0 {
                            continue;
                        }
                        let same = self.particles[i].species == self.particles[uj].species;
                        if !same && combat > 0.0 {
                            let ai = self.particles[i].emo[E_AGGRO];
                            let aj = self.particles[uj].emo[E_AGGRO];
                            if ai > 0.55 && ai > aj {
                                let steal = 0.012 * combat * dt * ai;
                                energy_delta[i] += steal;
                                energy_delta[uj] -= steal;
                                self.particles[uj].stress = (self.particles[uj].stress + 0.03).min(1.0);
                                if self.particles[i].lying {
                                    energy_delta[i] -= lie_pen * 0.15 * dt;
                                    self.particles[i].fitness -= 0.01;
                                }
                            } else if aj > 0.55 {
                                let steal = 0.012 * combat * dt * aj;
                                energy_delta[uj] += steal;
                                energy_delta[i] -= steal;
                            }
                        }
                        if same && altruism > 0.0 {
                            let ei = self.particles[i].energy;
                            let ej = self.particles[uj].energy;
                            if ei > ej + 0.18 && self.particles[i].emo[E_BELONG] > 0.5 {
                                let gift = 0.01 * altruism * dt * self.particles[i].emo[E_BELONG];
                                energy_delta[i] -= gift;
                                energy_delta[uj] += gift * 1.05;
                                self.particles[i].fitness += 0.002 * altruism;
                            }
                        }
                    }
                }
            }
            if self.particles[i].bond >= 0 {
                let j = self.particles[i].bond as usize;
                if j < n {
                    let dx = wrap_delta(self.particles[i].x, self.particles[j].x, w);
                    let dy = wrap_delta(self.particles[i].y, self.particles[j].y, h);
                    let d = dx.hypot(dy).max(1.0);
                    if d > 80.0 && self.rng.chance(0.01 * dt) {
                        // stale bond broken later
                    } else {
                        self.particles[i].vx += dx / d * 0.04 * dt;
                        self.particles[i].vy += dy / d * 0.04 * dt;
                    }
                }
            }
        }
        for i in 0..n {
            self.particles[i].energy = (self.particles[i].energy + energy_delta[i]).clamp(0.0, 1.4);
        }

        self.reproduce(dt);
    }

    fn reproduce(&mut self, dt: f32) {
        if self.particles.len() >= self.spawn_cap() {
            return;
        }
        let thr = self.params[P_REPRO_THRESHOLD];
        let cost = self.params[P_REPRO_COST];
        let sexual = self.params[P_SEXUAL_REPRO];
        let mutation = self.params[P_MUTATION];
        let poetry = self.params[P_MUTATION_POETRY];
        let wisdom = self.params[P_WISDOM_INHERIT];
        let beauty_s = self.params[P_BEAUTY_SELECT];
        let w = self.w;
        let h = self.h;
        let n = self.particles.len();
        let mut births: Vec<Particle> = Vec::new();

        for i in 0..n {
            if self.particles.len() + births.len() >= self.spawn_cap() {
                break;
            }
            let p_age = self.particles[i].age;
            let p_energy = self.particles[i].energy;
            if p_age < 90.0 || p_energy < thr {
                continue;
            }
            let desire = 0.35
                + self.particles[i].emo[E_BELONG] * 0.2
                + p_energy * 0.3
                + self.particles[i].beauty * beauty_s * 0.15;
            if !self.rng.chance(desire * 0.008 * dt) {
                continue;
            }

            let mut child_w = self.particles[i].weights;
            let mut child_pers = self.particles[i].pers;
            let parent_weights = self.particles[i].weights;
            let parent_fit = self.particles[i].fitness;
            let parent_id = self.particles[i].id;
            let parent_gen = self.particles[i].generation;
            let parent_species = self.particles[i].species;
            let parent_x = self.particles[i].x;
            let parent_y = self.particles[i].y;
            let parent_pers = self.particles[i].pers;
            let mut parent_b = 0u32;
            let mut used_sexual = false;

            if self.rng.chance(sexual) {
                let mut mate = None;
                let (cx, cy) = self.spatial.cell_xy(parent_x, parent_y);
                let mut best = 1.0e9;
                for oy in -1..=1 {
                    for ox in -1..=1 {
                        let mut j = self.spatial.head_at(cx + ox, cy + oy);
                        while j >= 0 {
                            let uj = j as usize;
                            j = self.spatial.next_of(uj);
                            if uj == i {
                                continue;
                            }
                            let q = &self.particles[uj];
                            if q.species != parent_species || q.energy < thr * 0.72 || q.age < 70.0 {
                                continue;
                            }
                            let d = wrap_delta(parent_x, q.x, w).hypot(wrap_delta(parent_y, q.y, h));
                            if d < 46.0 && d < best {
                                best = d;
                                mate = Some(uj);
                            }
                        }
                    }
                }
                if let Some(j) = mate {
                    let mate_w = self.particles[j].weights;
                    let mate_pers = self.particles[j].pers;
                    parent_b = self.particles[j].id;
                    nn::crossover(&parent_weights, &mate_w, &mut child_w, &mut self.rng, true);
                    for k in 0..PERS_COUNT {
                        child_pers[k] =
                            ((parent_pers[k] + mate_pers[k]) * 0.5 + self.rng.signed() * 0.05).clamp(0.05, 1.0);
                    }
                    used_sexual = true;
                    self.particles[j].energy -= cost * 0.35;
                }
            }

            let inherit = wisdom * (0.4 + parent_fit.tanh() * 0.4);
            nn::lerp_weights(&mut child_w, &parent_weights, inherit * 0.15);
            nn::mutate(&mut child_w, &mut self.rng, mutation * (1.0 - inherit * 0.45), poetry);
            for k in 0..PERS_COUNT {
                if self.rng.chance(mutation * 0.5) {
                    child_pers[k] = (child_pers[k] + self.rng.signed() * 0.08 * poetry).clamp(0.05, 1.0);
                }
            }

            self.particles[i].energy -= cost;
            let gen = parent_gen.saturating_add(1);
            if gen > self.max_gen {
                self.max_gen = gen;
            }
            let x = (parent_x + self.rng.signed() * 12.0).rem_euclid(self.w);
            let y = (parent_y + self.rng.signed() * 12.0).rem_euclid(self.h);
            let mut child = self.make_particle(
                x,
                y,
                parent_species,
                gen,
                parent_id,
                parent_b,
                Some(child_w),
                Some(child_pers),
            );
            child.energy = cost * 0.7;
            births.push(child);
            self.births += 1.0;
            self.emit(2.0, x, y, species_hue(parent_species, self.species_n()), if used_sexual { 1.0 } else { 0.55 });
        }

        self.particles.extend(births);
    }

    fn cull_and_age(&mut self, dt: f32) {
        let max_age = self.params[P_MAX_AGE].max(200.0);
        let mut i = 0;
        while i < self.particles.len() {
            let die = self.particles[i].energy <= 0.02 || self.particles[i].age > max_age;
            if die {
                let fit = self.particles[i].fitness + self.particles[i].beauty * self.params[P_BEAUTY_SELECT];
                if fit > 0.35 {
                    self.try_fossilize(i, fit);
                }
                self.emit(
                    3.0,
                    self.particles[i].x,
                    self.particles[i].y,
                    species_hue(self.particles[i].species, self.species_n()),
                    0.45,
                );
                self.break_bond(i);
                self.kill_swap(i);
                self.deaths += 1.0;
            } else {
                i += 1;
            }
        }

        // keep a living floor so the world never goes dark
        if self.particles.len() < 24 {
            let add = 40.min(self.spawn_cap().saturating_sub(self.particles.len()));
            for k in 0..add {
                if !self.fossils.is_empty() && self.rng.chance(0.45) {
                    let fi = (self.rng.f32() * self.fossils.len() as f32) as usize;
                    self.revive_fossil_inner(fi);
                } else {
                    let p = self.spawn_fresh(k, add);
                    self.particles.push(p);
                    self.births += 1.0;
                }
            }
        }
        let _ = dt;
    }

    fn try_fossilize(&mut self, i: usize, fit: f32) {
        let p = &self.particles[i];
        let fossil = Fossil {
            weights: p.weights,
            pers: p.pers,
            species: p.species,
            fitness: fit,
            generation: p.generation,
            hue: species_hue(p.species, self.species_n()),
        };
        if self.fossils.len() < FOSSIL_CAP {
            self.fossils.push(fossil);
            return;
        }
        if let Some((idx, minf)) = self
            .fossils
            .iter()
            .enumerate()
            .min_by(|a, b| a.1.fitness.partial_cmp(&b.1.fitness).unwrap_or(std::cmp::Ordering::Equal))
        {
            if fit > minf.fitness {
                self.fossils[idx] = fossil;
            }
        }
    }

    fn break_bond(&mut self, i: usize) {
        if i >= self.particles.len() {
            return;
        }
        let j = self.particles[i].bond;
        self.particles[i].bond = -1;
        if j >= 0 {
            let uj = j as usize;
            if uj < self.particles.len() && self.particles[uj].bond == i as i32 {
                self.particles[uj].bond = -1;
            }
        }
    }

    fn kill_swap(&mut self, i: usize) {
        let last = self.particles.len() - 1;
        if i != last {
            self.particles.swap(i, last);
            let partner = self.particles[i].bond;
            if partner >= 0 {
                let p = partner as usize;
                if p < self.particles.len() && self.particles[p].bond == last as i32 {
                    self.particles[p].bond = i as i32;
                }
            }
        }
        self.particles.pop();
        let n = self.particles.len();
        for p in self.particles.iter_mut() {
            if p.bond >= n as i32 {
                p.bond = -1;
            }
        }
    }

    fn revive_fossil_inner(&mut self, index: usize) {
        if index >= self.fossils.len() || self.particles.len() >= self.spawn_cap() {
            return;
        }
        let f = self.fossils[index].clone();
        let x = self.rng.f32() * self.w;
        let y = self.rng.f32() * self.h;
        let mut p = self.make_particle(x, y, f.species, f.generation, 0, 0, Some(f.weights), Some(f.pers));
        p.energy = 0.72;
        self.particles.push(p);
        self.emit(9.0, x, y, f.hue, 1.0);
    }

    pub fn revive_fossil(&mut self, index: u32, x: f32, y: f32) {
        let i = index as usize;
        if i >= self.fossils.len() || self.particles.len() >= self.spawn_cap() {
            return;
        }
        let f = self.fossils[i].clone();
        let mut p = self.make_particle(x, y, f.species, f.generation, 0, 0, Some(f.weights), Some(f.pers));
        p.energy = 0.8;
        self.particles.push(p);
        self.emit(9.0, x, y, f.hue, 1.2);
    }

    pub fn trigger_event(&mut self, kind: u32, x: f32, y: f32) {
        match kind {
            1 => {
                self.storm = [x, y, 0.0, 90.0, 1.0, 160.0];
                self.emit(1.0, x, y, 0.08, 1.4);
            }
            2 => {
                self.food.clear();
                self.emit(1.0, x, y, 0.08, 0.8);
            }
            3 => {
                for _ in 0..80 {
                    self.spawn_food();
                }
                self.emit(1.0, x, y, 0.22, 1.0);
            }
            4 => {
                self.storm = [x, y, 0.0, 140.0, 4.0, 180.0];
                self.emit(1.0, x, y, 0.85, 1.2);
            }
            5 => {
                self.portals[0] = x;
                self.portals[1] = y;
                self.portals[2] = (x + self.w * 0.45).rem_euclid(self.w);
                self.portals[3] = (y + self.h * 0.38).rem_euclid(self.h);
                self.portals[4] = 1.0;
                self.emit(7.0, x, y, 0.6, 1.3);
            }
            _ => {}
        }
    }

    pub fn apply_tool(&mut self, tool: u32, x: f32, y: f32, radius: f32, strength: f32, aux: f32) {
        let r = radius.max(8.0);
        let r2 = r * r;
        match tool {
            10 => self.trigger_event(aux as u32, x, y),
            11 => {
                self.portals[0] = x;
                self.portals[1] = y;
                self.portals[2] = (x + self.w * 0.4).rem_euclid(self.w);
                self.portals[3] = (y + self.h * 0.35).rem_euclid(self.h);
                self.portals[4] = 1.0;
                self.emit(7.0, x, y, 0.58, 1.0);
            }
            _ => {
                for i in 0..self.particles.len() {
                    let dx = wrap_delta(x, self.particles[i].x, self.w);
                    let dy = wrap_delta(y, self.particles[i].y, self.h);
                    let d2 = dx * dx + dy * dy;
                    if d2 > r2 {
                        continue;
                    }
                    let d = d2.sqrt().max(1.0);
                    let fall = 1.0 - d / r;
                    match tool {
                        0 => {
                            let pull = strength * fall * 2.6;
                            self.particles[i].vx -= dx / d * pull;
                            self.particles[i].vy -= dy / d * pull;
                            self.particles[i].x -= dx / d * pull * 0.55;
                            self.particles[i].y -= dy / d * pull * 0.55;
                        }
                        1 => {
                            let push = strength * fall * 2.6;
                            self.particles[i].vx += dx / d * push;
                            self.particles[i].vy += dy / d * push;
                            self.particles[i].x += dx / d * push * 0.55;
                            self.particles[i].y += dy / d * push * 0.55;
                        }
                        2 => self.particles[i].energy = (self.particles[i].energy + strength * 0.22 * fall).min(1.4),
                        3 => self.particles[i].energy = (self.particles[i].energy - strength * 0.18 * fall).max(0.0),
                        4 => {
                            let e = (aux as usize).min(EMO_COUNT - 1);
                            self.particles[i].emo[e] =
                                (self.particles[i].emo[e] + strength * 0.45 * fall).clamp(0.0, 1.0);
                        }
                        5 => {
                            if self.rng.chance(fall * 0.6) {
                                nn::mutate(
                                    &mut self.particles[i].weights,
                                    &mut self.rng,
                                    0.2 * strength,
                                    self.params[P_MUTATION_POETRY],
                                );
                                self.emit(8.0, self.particles[i].x, self.particles[i].y, 0.75, 0.5);
                            }
                        }
                        6 => {
                            self.particles[i].emo[E_BELONG] = (self.particles[i].emo[E_BELONG] + 0.3 * fall).min(1.0);
                            self.particles[i].emo[E_AGGRO] *= 1.0 - 0.4 * fall;
                            self.particles[i].stress *= 1.0 - 0.35 * fall;
                            self.particles[i].honesty = (self.particles[i].honesty + 0.2 * fall).min(1.0);
                            nn::mutate(&mut self.particles[i].weights, &mut self.rng, 0.03, 0.05);
                        }
                        7 => {
                            if self.particles[i].bond < 0 {
                                self.particles[i].emo[E_BELONG] = 1.0;
                            }
                        }
                        8 => self.break_bond(i),
                        9 => self.particles[i].frozen = (40.0 + strength * 80.0) as u16,
                        _ => {}
                    }
                    if tool == 0 || tool == 1 {
                        self.particles[i].x = self.particles[i].x.rem_euclid(self.w);
                        self.particles[i].y = self.particles[i].y.rem_euclid(self.h);
                    }
                }
                if tool == 7 {
                    self.force_alliances_in_radius(x, y, r);
                }
            }
        }
    }

    fn force_alliances_in_radius(&mut self, x: f32, y: f32, r: f32) {
        let mut ids: Vec<usize> = Vec::new();
        for i in 0..self.particles.len() {
            let d = wrap_delta(x, self.particles[i].x, self.w).hypot(wrap_delta(y, self.particles[i].y, self.h));
            if d < r && self.particles[i].bond < 0 {
                ids.push(i);
            }
        }
        let mut k = 0;
        while k + 1 < ids.len() {
            let a = ids[k];
            let b = ids[k + 1];
            self.particles[a].bond = b as i32;
            self.particles[b].bond = a as i32;
            self.alliances += 1.0;
            k += 2;
        }
    }

    pub fn pick(&self, x: f32, y: f32) -> i32 {
        let mut best = -1i32;
        let mut bestd = 56.0f32;
        for (i, p) in self.particles.iter().enumerate() {
            let d = wrap_delta(x, p.x, self.w).hypot(wrap_delta(y, p.y, self.h));
            let reach = 44.0 + p.energy * 12.0 + p.emo[E_DOM] * 10.0;
            if d < reach && d < bestd {
                bestd = d;
                best = i as i32;
            }
        }
        best
    }

    pub fn find_id(&self, id: u32) -> i32 {
        for (i, p) in self.particles.iter().enumerate() {
            if p.id == id {
                return i as i32;
            }
        }
        -1
    }

    pub fn inspect_particle(&self, i: u32, out: &mut [f32]) -> i32 {
        let i = i as usize;
        if i >= self.particles.len() || out.len() < INSPECT_LEN {
            return 0;
        }
        let p = &self.particles[i];
        out[0] = p.x;
        out[1] = p.y;
        out[2] = p.vx;
        out[3] = p.vy;
        out[4] = p.energy;
        out[5] = p.age;
        out[6] = p.health;
        out[7] = p.stress;
        out[8] = p.species as f32;
        out[9] = p.generation as f32;
        out[10] = p.bond as f32;
        out[11] = p.signal_hue;
        out[12] = p.signal_amp;
        out[13] = p.honesty;
        out[14] = if p.dreaming { 1.0 } else { 0.0 };
        out[15] = if p.lying { 1.0 } else { 0.0 };
        out[16] = p.fitness;
        out[17] = p.beauty;
        out[18] = p.id as f32;
        out[19] = p.parent_a as f32;
        out[20] = p.parent_b as f32;
        out[21] = p.received;
        for e in 0..EMO_COUNT {
            out[22 + e] = p.emo[e];
        }
        for k in 0..PERS_COUNT {
            out[29 + k] = p.pers[k];
        }
        out[35] = p.mem_reward;
        out[36] = p.idea as f32;
        1
    }

    pub fn inspect_weights(&self, i: u32, out: &mut [f32]) -> i32 {
        let i = i as usize;
        if i >= self.particles.len() || out.len() < WEIGHTS {
            return 0;
        }
        out[..WEIGHTS].copy_from_slice(&self.particles[i].weights);
        1
    }

    pub fn fossil_count(&self) -> u32 {
        self.fossils.len() as u32
    }

    pub fn fossil_info(&self, i: u32, out: &mut [f32]) -> i32 {
        let i = i as usize;
        if i >= self.fossils.len() || out.len() < 6 {
            return 0;
        }
        let f = &self.fossils[i];
        out[0] = f.species as f32;
        out[1] = f.fitness;
        out[2] = f.generation as f32;
        out[3] = f.hue;
        out[4] = f.pers[K_OPEN];
        out[5] = f.pers[K_WHIMSY];
        1
    }

    fn write_render(&mut self) {
        let species_n = self.species_n();
        let n = self.particles.len();
        for i in 0..n {
            let p = &self.particles[i];
            let o = i * RENDER_STRIDE;
            let sh = species_hue(p.species, species_n);
            let eh = emotion_hue(&p.emo, sh);
            let hue = lerp_hue(sh, eh, 0.42 + p.emo[E_CURIOSITY] * 0.2);
            let sat = (0.45 + p.stress * 0.18 + p.emo[E_AGGRO] * 0.12 + p.signal_amp * 0.1).clamp(0.2, 0.95);
            let val = (0.28 + p.energy * 0.55 + p.emo[E_PLAY] * 0.1 + if p.dreaming { 0.12 } else { 0.0 })
                .clamp(0.12, 1.15);
            let size = 2.1 + p.energy * 2.2 + p.emo[E_DOM] * 1.4 + if p.dreaming { 1.3 } else { 0.0 };
            let mut flags = 0.0;
            if p.dreaming {
                flags += 1.0;
            }
            if p.lying {
                flags += 2.0;
            }
            if p.bond >= 0 {
                flags += 4.0;
            }
            if p.idea > 0 {
                flags += 8.0;
            }
            if p.frozen > 0 {
                flags += 16.0;
            }
            self.render[o] = p.x;
            self.render[o + 1] = p.y;
            self.render[o + 2] = hue;
            self.render[o + 3] = sat;
            self.render[o + 4] = val;
            self.render[o + 5] = size;
            self.render[o + 6] = p.signal_amp;
            self.render[o + 7] = flags;
        }
        for (i, f) in self.food.iter().enumerate() {
            self.food_render[i * 3] = f.x;
            self.food_render[i * 3 + 1] = f.y;
            self.food_render[i * 3 + 2] = f.e;
        }
    }

    fn write_stats(&mut self) {
        let n = self.particles.len() as f32;
        let mut e = 0.0;
        let mut s = 0.0;
        let mut b = 0.0;
        for p in self.particles.iter() {
            e += p.energy;
            s += p.stress;
            b += p.beauty;
        }
        self.stats[0] = self.tick as f32;
        self.stats[1] = self.day;
        self.stats[2] = n;
        self.stats[3] = if n > 0.0 { e / n } else { 0.0 };
        self.stats[4] = if n > 0.0 { s / n } else { 0.0 };
        self.stats[5] = self.births;
        self.stats[6] = self.deaths;
        self.stats[7] = self.dreams;
        self.stats[8] = self.lies;
        self.stats[9] = self.alliances;
        self.stats[10] = self.max_gen as f32;
        self.stats[11] = if n > 0.0 { b / n } else { 0.0 };
        self.stats[12] = self.food.len() as f32;
        self.stats[13] = self.fossils.len() as f32;
        self.stats[14] = self.params[P_GOD_MOOD] + 0.22 * (self.day * TAU).sin();
        self.stats[15] = self.ideas;
    }

    pub fn render_ptr(&self) -> *const f32 {
        self.render.as_ptr()
    }
    pub fn food_ptr(&self) -> *const f32 {
        self.food_render.as_ptr()
    }
    pub fn events_ptr(&self) -> *const f32 {
        self.events.as_ptr()
    }
    pub fn portals_ptr(&self) -> *const f32 {
        self.portals.as_ptr()
    }
    pub fn storm_ptr(&self) -> *const f32 {
        self.storm.as_ptr()
    }
    pub fn stats_ptr(&self) -> *const f32 {
        self.stats.as_ptr()
    }

    pub fn alive(&self) -> u32 {
        self.particles.len() as u32
    }
    pub fn food_count(&self) -> u32 {
        self.food.len() as u32
    }
    pub fn event_count(&self) -> u32 {
        self.event_n as u32
    }
    pub fn tick(&self) -> u32 {
        self.tick
    }
    pub fn day(&self) -> f32 {
        self.day
    }
    pub fn width(&self) -> f32 {
        self.w
    }
    pub fn height(&self) -> f32 {
        self.h
    }

    pub fn bond_of(&self, i: u32) -> i32 {
        let i = i as usize;
        if i >= self.particles.len() {
            return -1;
        }
        self.particles[i].bond
    }

    pub fn snapshot_minds(&self, max: u32, out: &mut [f32]) -> u32 {
        let take = (max as usize).min(self.particles.len());
        let stride = 8 + PERS_COUNT + WEIGHTS;
        if out.len() < take * stride {
            return 0;
        }
        for i in 0..take {
            let p = &self.particles[i];
            let o = i * stride;
            out[o] = p.species as f32;
            out[o + 1] = p.energy;
            out[o + 2] = p.x;
            out[o + 3] = p.y;
            out[o + 4] = p.generation as f32;
            out[o + 5] = p.fitness;
            out[o + 6] = p.beauty;
            out[o + 7] = p.signal_hue;
            out[o + 8..o + 8 + PERS_COUNT].copy_from_slice(&p.pers);
            out[o + 8 + PERS_COUNT..o + stride].copy_from_slice(&p.weights);
        }
        take as u32
    }

    pub fn inject_mind(&mut self, data: &[f32]) {
        if data.len() < 8 + PERS_COUNT + WEIGHTS || self.particles.len() >= self.spawn_cap() {
            return;
        }
        let mut pers = [0.0; PERS_COUNT];
        pers.copy_from_slice(&data[8..8 + PERS_COUNT]);
        let mut wts = [0.0; WEIGHTS];
        wts.copy_from_slice(&data[8 + PERS_COUNT..8 + PERS_COUNT + WEIGHTS]);
        let mut p = self.make_particle(
            data[2].rem_euclid(self.w),
            data[3].rem_euclid(self.h),
            data[0] as u8,
            data[4] as u16,
            0,
            0,
            Some(wts),
            Some(pers),
        );
        p.energy = data[1].clamp(0.2, 1.2);
        p.fitness = data[5];
        p.beauty = data[6];
        self.particles.push(p);
    }
}

struct Biome {
    fertile: f32,
    barren: f32,
    volatile: f32,
}

fn biome_at(x: f32, y: f32, w: f32, h: f32) -> Biome {
    let left = if x < w * 0.5 { 1.0 } else { 0.0 };
    let top = if y < h * 0.5 { 1.0 } else { 0.0 };
    Biome {
        fertile: left * top,
        barren: (1.0 - left) * (1.0 - top),
        volatile: (1.0 - left) * top,
    }
}

fn default_matrix() -> [f32; SPECIES_MAX * SPECIES_MAX] {
    let mut m = [0.0; SPECIES_MAX * SPECIES_MAX];
    // A living default: kin mildly attract, a few chase pairs, short-range handled separately
    let preset = [
        [0.35, -0.25, 0.55, -0.15, 0.1, -0.4],
        [0.4, 0.3, -0.45, 0.2, -0.1, 0.15],
        [-0.2, 0.6, 0.25, -0.35, 0.45, -0.1],
        [0.15, -0.3, 0.2, 0.5, -0.45, 0.25],
        [-0.35, 0.1, -0.2, 0.55, 0.2, 0.4],
        [0.25, -0.15, 0.1, -0.25, 0.35, 0.45],
    ];
    for i in 0..SPECIES_MAX {
        for j in 0..SPECIES_MAX {
            m[i * SPECIES_MAX + j] = preset[i][j];
        }
    }
    m
}

#[inline]
fn wrap_delta(a: f32, b: f32, span: f32) -> f32 {
    let mut d = b - a;
    let half = span * 0.5;
    if d > half {
        d -= span;
    } else if d < -half {
        d += span;
    }
    d
}

#[inline]
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

#[inline]
fn hue_dist(a: f32, b: f32) -> f32 {
    let mut d = (a - b).abs();
    if d > 0.5 {
        d = 1.0 - d;
    }
    d * 2.0
}

#[inline]
fn lerp_hue(a: f32, b: f32, t: f32) -> f32 {
    let mut d = b - a;
    if d > 0.5 {
        d -= 1.0;
    } else if d < -0.5 {
        d += 1.0;
    }
    (a + d * t).rem_euclid(1.0)
}

fn species_hue(species: u8, n: usize) -> f32 {
    (species as f32) / (n.max(1) as f32)
}

fn emotion_hue(emo: &[f32; EMO_COUNT], fallback: f32) -> f32 {
    let hues = [0.52, 0.72, 0.0, 0.12, 0.08, 0.33, 0.86];
    let mut wsum = 0.0;
    let mut x = 0.0;
    let mut y = 0.0;
    for i in 0..EMO_COUNT {
        let w = emo[i];
        let ang = hues[i] * TAU;
        x += ang.cos() * w;
        y += ang.sin() * w;
        wsum += w;
    }
    if wsum < 0.12 {
        return fallback;
    }
    y.atan2(x).rem_euclid(TAU) / TAU
}
