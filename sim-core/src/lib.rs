mod nn;
mod params;
mod rng;
mod spatial;
mod world;

use wasm_bindgen::prelude::*;
use world::World;

pub use nn::WEIGHTS;
pub use params::{INSPECT_LEN, PARAM_COUNT, STAT_LEN};

#[wasm_bindgen]
pub struct Sim {
    inner: World,
}

#[wasm_bindgen]
impl Sim {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32, count: u32, seed: f64) -> Sim {
        Sim {
            inner: World::new(width, height, count, seed as u64),
        }
    }

    pub fn step(&mut self) {
        self.inner.step();
    }

    pub fn set_params(&mut self, data: &[f32]) {
        self.inner.set_params(data);
    }

    pub fn set_matrix(&mut self, data: &[f32]) {
        self.inner.set_matrix(data);
    }

    pub fn resize(&mut self, width: f32, height: f32) {
        self.inner.resize(width, height);
    }

    pub fn seed_count(&mut self, count: u32) {
        self.inner.seed_count(count);
    }

    pub fn set_particle_limit(&mut self, n: u32) {
        self.inner.set_particle_limit(n);
    }

    pub fn particle_limit(&self) -> u32 {
        self.inner.particle_limit()
    }

    pub fn apply_tool(&mut self, tool: u32, x: f32, y: f32, radius: f32, strength: f32, aux: f32) {
        self.inner.apply_tool(tool, x, y, radius, strength, aux);
    }

    pub fn trigger_event(&mut self, kind: u32, x: f32, y: f32) {
        self.inner.trigger_event(kind, x, y);
    }

    pub fn pick(&self, x: f32, y: f32) -> i32 {
        self.inner.pick(x, y)
    }

    pub fn find_id(&self, id: u32) -> i32 {
        self.inner.find_id(id)
    }

    pub fn inspect_particle(&self, i: u32, out: &mut [f32]) -> i32 {
        self.inner.inspect_particle(i, out)
    }

    pub fn inspect_weights(&self, i: u32, out: &mut [f32]) -> i32 {
        self.inner.inspect_weights(i, out)
    }

    pub fn fossil_count(&self) -> u32 {
        self.inner.fossil_count()
    }

    pub fn fossil_info(&self, i: u32, out: &mut [f32]) -> i32 {
        self.inner.fossil_info(i, out)
    }

    pub fn revive_fossil(&mut self, index: u32, x: f32, y: f32) {
        self.inner.revive_fossil(index, x, y);
    }

    pub fn snapshot_minds(&self, max: u32, out: &mut [f32]) -> u32 {
        self.inner.snapshot_minds(max, out)
    }

    pub fn inject_mind(&mut self, data: &[f32]) {
        self.inner.inject_mind(data);
    }

    pub fn alive(&self) -> u32 {
        self.inner.alive()
    }

    pub fn food_count(&self) -> u32 {
        self.inner.food_count()
    }

    pub fn event_count(&self) -> u32 {
        self.inner.event_count()
    }

    pub fn tick(&self) -> u32 {
        self.inner.tick()
    }

    pub fn day(&self) -> f32 {
        self.inner.day()
    }

    pub fn width(&self) -> f32 {
        self.inner.width()
    }

    pub fn height(&self) -> f32 {
        self.inner.height()
    }

    pub fn bond_of(&self, i: u32) -> i32 {
        self.inner.bond_of(i)
    }

    pub fn render_ptr(&self) -> *const f32 {
        self.inner.render_ptr()
    }

    pub fn food_ptr(&self) -> *const f32 {
        self.inner.food_ptr()
    }

    pub fn events_ptr(&self) -> *const f32 {
        self.inner.events_ptr()
    }

    pub fn portals_ptr(&self) -> *const f32 {
        self.inner.portals_ptr()
    }

    pub fn storm_ptr(&self) -> *const f32 {
        self.inner.storm_ptr()
    }

    pub fn stats_ptr(&self) -> *const f32 {
        self.inner.stats_ptr()
    }

    pub fn render_stride(&self) -> u32 {
        crate::params::RENDER_STRIDE as u32
    }

    pub fn weights_len(&self) -> u32 {
        WEIGHTS as u32
    }
}
