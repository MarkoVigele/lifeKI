use crate::rng::Rng;

pub const IN: usize = 16;
pub const HID: usize = 12;
pub const OUT: usize = 8;
pub const WEIGHTS: usize = IN * HID + HID + HID * OUT + OUT;

#[inline]
pub fn infer(weights: &[f32], input: &[f32], hidden: &mut [f32], output: &mut [f32]) {
    let ih = IN * HID;
    for h in 0..HID {
        let mut s = weights[ih + h];
        let row = h * IN;
        for i in 0..IN {
            s += weights[row + i] * input[i];
        }
        hidden[h] = s.tanh();
    }
    let ho0 = ih + HID;
    let b0 = ho0 + HID * OUT;
    for o in 0..OUT {
        let mut s = weights[b0 + o];
        let row = ho0 + o * HID;
        for h in 0..HID {
            s += weights[row + h] * hidden[h];
        }
        output[o] = s.tanh();
    }
}

pub fn hebbian(
    weights: &mut [f32],
    input: &[f32],
    hidden: &[f32],
    output: &[f32],
    lr: f32,
    reward: f32,
) {
    if lr.abs() < 1e-8 || reward.abs() < 1e-6 {
        return;
    }
    let scale = (lr * reward).clamp(-0.08, 0.08);
    let ih = IN * HID;
    for h in 0..HID {
        let row = h * IN;
        let hh = hidden[h];
        for i in 0..IN {
            weights[row + i] = (weights[row + i] + scale * input[i] * hh).clamp(-3.5, 3.5);
        }
        weights[ih + h] = (weights[ih + h] + scale * hh * 0.25).clamp(-3.5, 3.5);
    }
    let ho0 = ih + HID;
    let b0 = ho0 + HID * OUT;
    for o in 0..OUT {
        let row = ho0 + o * HID;
        let oo = output[o];
        for h in 0..HID {
            weights[row + h] = (weights[row + h] + scale * hidden[h] * oo).clamp(-3.5, 3.5);
        }
        weights[b0 + o] = (weights[b0 + o] + scale * oo * 0.25).clamp(-3.5, 3.5);
    }
}

pub fn random_weights(rng: &mut Rng, out: &mut [f32]) {
    let s = (2.0 / IN as f32).sqrt();
    for w in out.iter_mut() {
        *w = rng.signed() * s;
    }
}

pub fn mutate(weights: &mut [f32], rng: &mut Rng, rate: f32, poetry: f32) {
    let n = weights.len();
    let flips = ((n as f32) * rate * 0.35).ceil() as usize;
    for _ in 0..flips {
        let i = (rng.f32() * n as f32) as usize % n;
        let jump = if rng.chance(poetry * 0.35) {
            rng.signed() * (0.45 + poetry * 1.1)
        } else {
            rng.signed() * (0.06 + poetry * 0.12)
        };
        weights[i] = (weights[i] + jump).clamp(-3.5, 3.5);
    }
}

pub fn crossover(a: &[f32], b: &[f32], out: &mut [f32], rng: &mut Rng, blend: bool) {
    for i in 0..out.len() {
        out[i] = if blend {
            a[i] * 0.5 + b[i] * 0.5 + rng.signed() * 0.02
        } else if rng.chance(0.5) {
            a[i]
        } else {
            b[i]
        };
    }
}

pub fn lerp_weights(dst: &mut [f32], src: &[f32], t: f32) {
    let t = t.clamp(0.0, 1.0);
    let u = 1.0 - t;
    for i in 0..dst.len() {
        dst[i] = dst[i] * u + src[i] * t;
    }
}
