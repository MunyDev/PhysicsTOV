import math

import scipy.integrate
import sympy
from math import pi
k = 3000  # Stiffness of material
gamma = 3000 # reversible adiabatic (or )
rho_c = 3000
M = 3000
G = 6.67 * pow(10, -11)
c = 299792458
def schwarzschild_radius(r):
    return (2 * G * M) / (r * c**2)
def rho_mass_of_r(P, r): 
    return pow(P/k, (1/gamma))

def dm_of_dr(P, r):
    # return 4 * pi * r**2 * rho_mass * (1 - (1 / math.sqrt(1 - schwarzschild_radius(r))))
    return 4 * pi * r*r*rho_mass_of_r(P, r)
def integrate_mass(fr, to, P, initial_condition = 0, steps=0.0001):
    mass = initial_condition
    for i in range(fr, to,steps):
        mass = mass + steps * dm_of_dr(P, i)
    return mass
def model(P, r):
    rho = pow((P/k), (1/gamma))
    mass = integrate_mass(0, r, P, initial_condition=0, steps=0.0001)
    
    
integrate_mass(0, 20)